const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const esc = (v='') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')
const clean = (v='') => String(v).replace(/<[^>]*>/g,' ').replace(/&nbsp;|\u00a0/gi,' ').replace(/\s+/g,' ').trim()
const publisher = (row) => { let s = clean(row?.source?.name || 'Vetor Global'); const t = clean(row?.title || ''); if (/^google news/i.test(s)) { const m = t.match(/\s[-|–—]\s([^|–—-]{2,90})\s*$/); if (m?.[1]) s = clean(m[1]) } return s || 'Vetor Global' }
const emptyXml = () => '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>'
export default async function handler(req,res){
  try {
    let rows = []
    if (SUPABASE_URL && SUPABASE_KEY) {
      const endpoint = `${SUPABASE_URL}/rest/v1/articles?select=id,title,published_at,created_at,category:categories(slug),source:sources(name)&order=published_at.desc&limit=200`
      const r = await fetch(endpoint,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}})
      if (r.ok) rows = await r.json()
    }
    const cutoff = Date.now() - 48*60*60*1000
    const recent = rows.filter(row => {
      const value = row?.published_at || row?.created_at
      const time = value ? Date.parse(value) : NaN
      return Number.isFinite(time) && time >= cutoff
    }).slice(0,100)
    const urls = recent.map(row => {
      const title = clean(row.title || 'Notícia')
      const date = row.published_at || row.created_at
      return `<url><loc>https://vetorglobal.com.br/noticia/${encodeURIComponent(row.id)}</loc><news:news><news:publication><news:name>${esc(publisher(row))}</news:name><news:language>pt</news:language></news:publication><news:publication_date>${esc(date)}</news:publication_date><news:title>${esc(title)}</news:title></news:news></url>`
    }).join('')
    const xml = urls ? `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>` : emptyXml()
    res.setHeader('Content-Type','application/xml; charset=utf-8')
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=1800')
    return res.status(200).send(xml)
  } catch {
    res.setHeader('Content-Type','application/xml; charset=utf-8')
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=1800')
    return res.status(200).send(emptyXml())
  }
}
