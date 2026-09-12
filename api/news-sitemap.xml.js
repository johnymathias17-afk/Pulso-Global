const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY

const esc = (v='') => String(v)
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&apos;')

const clean = (v='') => String(v)
  .replace(/<[^>]*>/g,' ')
  .replace(/&nbsp;|\u00a0/gi,' ')
  .replace(/\s+/g,' ')
  .trim()

const w3cDate = (value) => {
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString()
}

const emptyXml = () => '<?xml version="1.0" encoding="UTF-8"?>' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>'

export default async function handler(req,res){
  try {
    let rows = []
    const cutoff = new Date(Date.now() - 48*60*60*1000).toISOString()

    if (SUPABASE_URL && SUPABASE_KEY) {
      const endpoint = `${SUPABASE_URL}/rest/v1/articles?select=id,title,published_at,created_at&published_at=gte.${encodeURIComponent(cutoff)}&order=published_at.desc&limit=100`
      const r = await fetch(endpoint, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: 'application/json'
        }
      })
      if (!r.ok) throw new Error(`Supabase HTTP ${r.status}`)
      const data = await r.json()
      if (Array.isArray(data)) rows = data
    }

    const urls = rows.map(row => {
      const title = clean(row?.title || 'Notícia')
      const date = w3cDate(row?.published_at || row?.created_at)
      const id = encodeURIComponent(row?.id ?? '')
      return `<url><loc>https://vetorglobal.com.br/noticia/${id}</loc><news:news><news:publication><news:name>Vetor Global</news:name><news:language>pt</news:language></news:publication><news:publication_date>${esc(date)}</news:publication_date><news:title>${esc(title)}</news:title></news:news></url>`
    }).join('')

    const xml = urls
      ? `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`
      : emptyXml()

    res.setHeader('Content-Type','application/xml; charset=utf-8')
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=1800')
    return res.status(200).send(xml)
  } catch (error) {
    res.setHeader('Content-Type','application/xml; charset=utf-8')
    res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=300')
    return res.status(200).send(emptyXml())
  }
}
