const SYMBOLS = {
  BTC: 'BTC-USD',
  ETH: 'ETH-USD',
  'USD/BRL': 'BRL=X',
  IBOV: '^BVSP',
  XAU: 'GC=F',
}

async function quote(symbol, yahooSymbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1m&range=1d`
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Vetor Global market data)' },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`${symbol}: Yahoo HTTP ${response.status}`)

  const payload = await response.json()
  const meta = payload?.chart?.result?.[0]?.meta
  const price = Number(meta?.regularMarketPrice ?? meta?.previousClose)
  const previous = Number(meta?.chartPreviousClose ?? meta?.previousClose)
  if (!Number.isFinite(price)) throw new Error(`${symbol}: preço indisponível`)

  return {
    symbol,
    price,
    changePct: Number.isFinite(previous) && previous !== 0 ? ((price - previous) / previous) * 100 : null,
    updatedAt: new Date().toISOString(),
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  if (req.method === 'OPTIONS') return res.status(204).end()

  const results = await Promise.allSettled(
    Object.entries(SYMBOLS).map(([symbol, yahooSymbol]) => quote(symbol, yahooSymbol))
  )

  const quotes = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)

  if (!quotes.length) {
    return res.status(502).json({ success: false, quotes: [], error: 'Nenhuma cotação disponível' })
  }

  return res.status(200).json({ success: true, source: 'Yahoo Finance via Vercel', quotes })
}
