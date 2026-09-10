import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const client = createClient(supabaseUrl, supabaseKey)

// Market quotes must never be served from an intermediate cache. Keep the
// normal Supabase client API intact while adding a small retry for transient
// Edge Function/network failures.
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

      // One controlled retry prevents a temporary Edge Function/network
      // failure from leaving the dashboard looking frozen for the next minute.
      if (result.error) {
        await new Promise(resolve => setTimeout(resolve, 1200))
        result = await target.invoke(functionName, { ...options, body: { ...body, _retry: Date.now() }, headers: { ...headers, 'X-Market-Retry': '1' } })
      }

      return result
    }
  },
})

export const supabase = new Proxy(client, {
  get(target, property, receiver) {
    if (property === 'functions') return functionsProxy
    return Reflect.get(target, property, receiver)
  },
})
