const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

function esc(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export default async function handler(req, res) {
  try {
    let articles = []
    if (SUPABASE_URL && SUPABASE_KEY) {
      const endpoint = `${SUPABASE_URL}/rest/v1/articles?select=id,title,summary,url,published_at,created_at,category:categories(name),source:sources(name)&order=published_at.desc&limit=30`
      const response = await fetch(endpoint, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
      if (response.ok) articles = await response.json()
    }
    const items = (articles || []).map(article => {
      const title = esc(article.title || 'Notícia')
      const summary = esc(article.summary || '')
      const date = article.published_at || article.created_at || new Date().toISOString()
      const link = `https://vetorglobal.com.br/noticia/${encodeURIComponent(article.id)}`
      return `<item><title>${title}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><description>${summary}</description><pubDate>${new Date(date).toUTCString()}</pubDate><source url="https://vetorglobal.com.br/">Vetor Global</source></item>`
    }).join('')
    const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Vetor Global</title><link>https://vetorglobal.com.br/</link><description>Notícia → contexto → impacto.</description><language>pt-BR</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}</channel></rss>`
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600')
    return res.status(200).send(xml)
  } catch (error) {
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Vetor Global</title><link>https://vetorglobal.com.br/</link><description>Notícia → contexto → impacto.</description></channel></rss>')
  }
}
