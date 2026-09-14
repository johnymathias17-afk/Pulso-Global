import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')
s = s.replaceAll('Informação que move decisões.', 'Informações que movem decisões.')
s = s.replaceAll("color: '#667085', fontSize: '11px'", "color: '#475467', fontSize: '11px', fontWeight: '500'")
s = s.replaceAll("color: '#475467', fontSize: '17px'", "color: '#344054', fontSize: '17px', fontWeight: '500'")
s = s.replaceAll("color: '#475467', fontSize: '16px'", "color: '#344054', fontSize: '16px', fontWeight: '500'")
s = s.replaceAll("color: '#667085'", "color: '#475467'")
s = s.replaceAll("color: '#98A2B3'", "color: '#667085'")

// Editorial intelligence: select the strongest lead without sacrificing chronological 'Últimas'.
if (!s.includes('const scoreEditorial =')) {
  const intelligence = `
const scoreEditorial = article => {
  const title = String(article?.title || '').replace(/<[^>]*>/g, ' ').trim()
  const summary = String(article?.summary || '').replace(/<[^>]*>/g, ' ').trim()
  const source = String(article?.source?.name || '').toLowerCase()
  const published = new Date(article?.published_at || article?.created_at || 0).getTime()
  const ageHours = Number.isFinite(published) ? Math.max(0, (Date.now() - published) / 36e5) : 999
  const freshness = Math.max(0, 34 - Math.min(ageHours, 34))
  const image = article?.image_url ? 9 : 0
  const summaryScore = summary.length >= 80 ? 12 : summary.length >= 40 ? 7 : 0
  const titleScore = title.length >= 35 && title.length <= 120 ? 8 : title.length > 20 ? 4 : 0
  const trusted = /(reuters|bbc|cnn brasil|cnn|uol|folha|valor|estadao|estadão|g1|agencia brasil|bloomberg|financial times|money times|portal do bitcoin|vista patria|dallagnol)/i.test(source) ? 9 : 4
  const impact = /(fed|fomc|juros|inflacao|ipca|cpi|dolar|ibovespa|bitcoin|ethereum|cripto|guerra|petroleo|petróleo|stf|supremo|moraes|trump|magnitsky|ministro|ministros|governo|congresso|eleicao|eleição|tarifa|china|eua|ia|inteligencia artificial|tecnologia|sanção|sancao|crise|decisão|decisao)/i.test(title + ' ' + summary) ? 8 : 0
  const engagement = /(trump|moraes|stf|supremo|magnitsky|sanções|sancoes|ministro|ministros|crise|guerra|prisão|prisao|confronto|afastamento|investigação|investigacao|vaza|escândalo|escandalo|decisão|decisao|sanção|sancao|tarifa|ameaça|ameaca|urgente)/i.test(title + ' ' + summary) ? 18 : 0
  const lowEngagement = /(mais procurad|mais buscad|segundo investimento|aves|fauna|horóscopo|horoscopo|previsão do tempo|previsao do tempo)/i.test(title) ? -16 : 0
  return freshness + image + summaryScore + titleScore + trusted + impact + engagement + lowEngagement
}
const selecionarDestaque = items => [...items].sort((a, b) => { const diff = scoreEditorial(b) - scoreEditorial(a); if (diff) return diff; return new Date(b?.published_at || b?.created_at || 0) - new Date(a?.published_at || a?.created_at || 0) })
`
  s = s.replace("function dataFormatada(data)", intelligence + "function dataFormatada(data)")
}

// Real audience data for 'Mais Lidas'. Never fabricate readership.
if (!s.includes('const [maisLidas, setMaisLidas]')) {
  s = s.replace("  const [newsletterAceita, setNewsletterAceita] = useState(true)\n", "  const [newsletterAceita, setNewsletterAceita] = useState(true)\n  const [maisLidas, setMaisLidas] = useState([])\n")
  const effectPatch = `
  useEffect(() => {
    async function carregarMaisLidas() {
      const { data, error } = await supabase.from('article_views').select('article_id,view_count').order('view_count', { ascending: false }).limit(20)
      if (error) { console.error('Erro ao carregar Mais Lidas:', error); return }
      const byId = new Map((data || []).map(row => [String(row.article_id), Number(row.view_count || 0)]))
      const ranked = articles.filter(a => byId.has(String(a.id))).map(a => ({ ...a, view_count: byId.get(String(a.id)) || 0 })).sort((a,b) => b.view_count - a.view_count)
      setMaisLidas(ranked.slice(0, 5))
    }
    if (articles.length) carregarMaisLidas()
  }, [articles])
`
  s = s.replace("  async function inscreverNewsletter(e)", effectPatch + "\n  async function inscreverNewsletter(e)")
}

// Broaden the live homepage window. The database remains the permanent archive.
s = s.replaceAll(".order('published_at', { ascending: false, nullsFirst: false }).limit(50)", ".order('published_at', { ascending: false, nullsFirst: false }).limit(150)")

s = s.replaceAll('Vetor Global • AGORA</span>', 'Vetor Global • VETOR SELECIONA</span>')
s = s.replaceAll("${noticiasFiltradas.length} notícias em destaque", 'Cobertura em tempo real')

// Make the Radar Cripto CTA a real navigation target instead of only changing the category filter.
s = s.replace("<button className=\"ghost\" onClick={() => navegar('cripto')}>₿ Radar Cripto</button>", "<button className=\"ghost\" onClick={() => { setActive('cripto'); requestAnimationFrame(() => document.getElementById('radar-cripto')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }}>₿ Radar Cripto</button>")
s = s.replace('<section className="vg-two"><Categoria titulo="₿ Radar Cripto"', '<section className="vg-two" id="radar-cripto"><Categoria titulo="₿ Radar Cripto"')

// 24h editorial shelf life: strong recent stories remain discoverable while the lead can rotate.
if (!s.includes('vg-shelf')) {
  s = s.replace("  const radarImpacto = selecionadas.filter(item => item?.id !== destaque?.id).slice(0, 3)\n", "  const radarImpacto = selecionadas.filter(item => item?.id !== destaque?.id).slice(0, 3)\n  const shelfCutoff = Date.now() - 24 * 3600000\n  const emDestaque = useMemo(() => rankingEditorial(noticiasFiltradas.filter(item => new Date(item?.published_at || item?.created_at || 0).getTime() >= shelfCutoff)).filter(item => item?.id !== destaque?.id).slice(0, 4), [noticiasFiltradas, destaque])\n")
  const shelf = `<section className="vg-section vg-shelf"><div className="vg-section-head"><div><span className="eyebrow">24 HORAS</span><h2>Em destaque</h2></div><span className="live">● HISTÓRIAS QUE AINDA IMPORTAM</span></div><div className="vg-grid">{emDestaque.map(article => <Article key={article.id} article={article} />)}</div></section>`
  s = s.replace('<section className="vg-section vg-impact-section">', shelf + '\n\n      <section className="vg-section vg-impact-section">')
  const shelfCss = `.vg-shelf{border-top:1px solid #e4e7ec}.vg-shelf .vg-section-head{margin-bottom:18px}`
  s = s.replace('const css = `', 'const css = `' + shelfCss)
}

if (!s.includes('vg-most-read')) {
  const mostRead = `<section className="vg-section vg-most-read"><div className="vg-section-head"><div><span className="eyebrow">AUDIÊNCIA REAL</span><h2>Mais lidas</h2></div><span className="live">● ÚLTIMAS VISUALIZAÇÕES</span></div>{maisLidas.length ? <div className="vg-most-read-list">{maisLidas.map((article, index) => { const item = noticiaApresentavel(article); return <a className="vg-most-read-item" href={"/noticia/" + encodeURIComponent(item.id)} key={item.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.displayTitle}</strong><small>{item.displaySource} • {article.view_count} {article.view_count === 1 ? 'visualização' : 'visualizações'}</small></div></a> })}</div> : <div className="vg-empty">O ranking de audiência está sendo construído com visualizações reais.</div>}</section>`
  s = s.replace('<section className="vg-section" id="mercados">', mostRead + '\n\n      <section className="vg-section" id="mercados">')
  const cssPatch = `.vg-most-read-list{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.vg-most-read-item{display:flex;gap:10px;min-width:0;padding:15px;text-decoration:none;background:#fff;border:1px solid #e4e7ec;border-radius:12px;color:#101828}.vg-most-read-item>span{font-size:24px;font-weight:900;color:#d4a72c;line-height:1}.vg-most-read-item strong{display:block;font-family:Georgia,"Times New Roman",serif;font-size:16px;line-height:1.18}.vg-most-read-item small{display:block;color:#667085;font-size:10px;margin-top:9px}.vg-most-read-item:hover{border-color:#b2ccff;transform:translateY(-1px)}@media(max-width:900px){.vg-most-read-list{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.vg-most-read-list{grid-template-columns:1fr}.vg-most-read-item{padding:14px}.vg-most-read-item strong{font-size:18px}.vg-most-read-item small{font-size:12px}}`
  s = s.replace('const css = `', 'const css = `' + cssPatch)
}

fs.writeFileSync(path, s)
console.log('Brand, readability, editorial intelligence, 24h shelf life, real-audience ranking and discovery patch applied')
