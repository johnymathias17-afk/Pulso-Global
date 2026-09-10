const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

function esc(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export default async function handler(req, res) {
  try {
    const urls = ['https://vetorglobal.com.br/']
    if (SUPABASE_URL && SUPABASE_KEY) {
      const endpoint = `${SUPABASE_URL}/rest/v1/articles?select=id,published_at,created_at&order=published_at.desc&limit=500`
      const response = await fetch(endpoint, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })
      if (response.ok) {
        const articles = await response.json()
        for (const article of articles || []) {
          if (article?.id != null) {
            const lastmod = article.published_at || article.created_at
            urls.push(`<url><loc>https://vetorglobal.com.br/noticia/${esc(article.id)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}<changefreq>daily</changefreq><priority>0.8</priority></url>`)
          }
        }
      }
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => url.startsWith('<url>') ? url : `<url><loc>${url}</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`).join('')}</urlset>`
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600')
    return res.status(200).send(xml)
  } catch (error) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://vetorglobal.com.br/</loc></url></urlset>')
  }
}
