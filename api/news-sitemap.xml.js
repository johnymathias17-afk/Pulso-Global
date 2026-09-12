const SUPABASE_URL = 'https://zcoyngtplusdskknjtmi.supabase.co'
const SUPABASE_KEY = 'sb_publishable_-swenpBIZ3zhJ7FUX0opaw_smnXZlhO'

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
  return Number.isFinite(d.getTime()) ? d.toISOString() : null
}

const emptyXml = () => '<?xml version="1.0" encoding="UTF-8"?>' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>'

export default async function handler(req,res){
  try {
    const cutoff = new Date(Date.now() - 48*60*60*1000).toISOString()
    const endpoint = `${SUPABASE_URL}/rest/v1/articles?select=id,title,published_at,created_at&or=(published_at.gte.${encodeURIComponent(cutoff)},and(published_at.is.null,created_at.gte.${encodeURIComponent(cutoff)}))&order=published_at.desc,created_at.desc&limit=100`
    const r = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json'
      }
    })
    if (!r.ok) throw new Error(`Supabase HTTP ${r.status}`)
    const data = await r.json()
    const rows = Array.isArray(data) ? data : []

    const urls = rows.map(row => {
      const title = clean(row?.title || 'Notícia')
      const date = w3cDate(row?.published_at || row?.created_at)
      const id = encodeURIComponent(row?.id ?? '')
      if (!date || !id) return ''
      return `<url><loc>https://vetorglobal.com.br/noticia/${id}</loc><news:news><news:publication><news:name>Vetor Global</news:name><news:language>pt</news:language></news:publication><news:publication_date>${esc(date)}</news:publication_date><news:title>${esc(title)}</news:title></news:news></url>`
    }).filter(Boolean).join('')

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
