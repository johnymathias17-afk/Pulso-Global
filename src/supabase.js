import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const client = createClient(supabaseUrl, supabaseKey)

// Market quotes: use the Supabase Edge Function first, then fall back to the
// Vercel serverless endpoint if the Edge Function returns an empty/stale set.
const functionsProxy = new Proxy(client.functions, {
  get(target, property, receiver) {
    if (property !== 'invoke') return Reflect.get(target, property, receiver)

    return async (functionName, options = {}) => {
      if (functionName !== 'market-quotes') {
        return target.invoke(functionName, options)
      }

      const now = Date.now()
      const headers = {
        ...(options.headers || {}),
        'Cache-Control': 'no-cache, no-store, max-age=0',
        Pragma: 'no-cache',
        'X-Market-Refresh': String(now),
      }
      const body = options.body && typeof options.body === 'object'
        ? { ...options.body, _refresh: now }
        : { _refresh: now }

      let result = await target.invoke(functionName, { ...options, body, headers })

      if (result.error) {
        await new Promise(resolve => setTimeout(resolve, 1200))
        result = await target.invoke(functionName, {
          ...options,
          body: { ...body, _retry: Date.now() },
          headers: { ...headers, 'X-Market-Retry': '1' },
        })
      }

      const edgeQuotes = result?.data?.quotes
      if (!result.error && Array.isArray(edgeQuotes) && edgeQuotes.length > 0) {
        return result
      }

      // Fallback is only for market-quotes; all other Edge Functions remain unchanged.
      try {
        const fallback = await fetch(`/api/market-quotes?_refresh=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, max-age=0' },
        })
        if (fallback.ok) {
          const data = await fallback.json()
          if (Array.isArray(data?.quotes) && data.quotes.length > 0) {
            return { data, error: null }
          }
        }
      } catch (fallbackError) {
        console.error('Fallback de cotações indisponível:', fallbackError)
      }

      // Important: return an error when there is no real quote data, so the UI
      // does not falsely display a fresh timestamp for an empty response.
      return {
        data: null,
        error: result?.error || new Error('Nenhuma cotação disponível'),
      }
    }
  },
})

export const supabase = new Proxy(client, {
  get(target, property, receiver) {
    if (property === 'functions') return functionsProxy
    return Reflect.get(target, property, receiver)
  },
})
