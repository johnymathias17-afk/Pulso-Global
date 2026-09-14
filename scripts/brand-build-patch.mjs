import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')

// Text/readability baseline.
s = s.replaceAll('Informação que move decisões.', 'Informações que movem decisões.')
s = s.replaceAll("color: '#667085', fontSize: '11px'", "color: '#475467', fontSize: '11px', fontWeight: '500'")
s = s.replaceAll("color: '#475467', fontSize: '17px'", "color: '#344054', fontSize: '17px', fontWeight: '500'")
s = s.replaceAll("color: '#475467', fontSize: '16px'", "color: '#344054', fontSize: '16px', fontWeight: '500'")
s = s.replaceAll("color: '#667085'", "color: '#475467'")
s = s.replaceAll("color: '#98A2B3'", "color: '#667085'")

// Editorial intelligence.
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
  const trusted = /(reuters|bbc|cnn brasil|cnn|uol|folha|valor|estadao|estadão|g1|agencia brasil|bloomberg|financial times|money times|portal do bitcoin)/i.test(source) ? 9 : 4
  const impact = /(fed|fomc|juros|inflacao|ipca|cpi|dolar|ibovespa|bitcoin|ethereum|cripto|guerra|petroleo|petróleo|stf|supremo|moraes|trump|magnitsky|ministro|ministros|governo|congresso|eleicao|eleição|tarifa|china|eua|ia|inteligencia artificial|tecnologia|sanção|sancao|crise|decisão|decisao)/i.test(title + ' ' + summary) ? 8 : 0
  const engagement = /(trump|moraes|stf|supremo|magnitsky|sanções|sancoes|ministro|ministros|crise|guerra|prisão|prisao|confronto|afastamento|investigação|investigacao|vaza|escândalo|escandalo|decisão|decisao|sanção|sancao|tarifa|ameaça|ameaca|urgente)/i.test(title + ' ' + summary) ? 18 : 0
  const lowEngagement = /(mais procurad|mais buscad|segundo investimento|aves|fauna|horóscopo|horoscopo|previsão do tempo|previsao do tempo)/i.test(title) ? -16 : 0
  return freshness + image + summaryScore + titleScore + trusted + impact + engagement + lowEngagement
}
const rankingEditorial = items => [...items].sort((a, b) => { const diff = scoreEditorial(b) - scoreEditorial(a); if (diff) return diff; return new Date(b?.published_at || b?.created_at || 0) - new Date(a?.published_at || a?.created_at || 0) })
`
  s = s.replace("function dataFormatada(data)", intelligence + "function dataFormatada(data)")
}

// Load a wider live window; the database remains the permanent archive.
s = s.replaceAll(".order('published_at', { ascending: false, nullsFirst: false }).limit(50)", ".order('published_at', { ascending: false, nullsFirst: false }).limit(150)")

// Real-audience 'Mais Lidas'.
if (!s.includes('const [maisLidas, setMaisLidas]')) {
  s = s.replace("  const [newsletterAceita, setNewsletterAceita] = useState(true)\n", "  const [newsletterAceita, setNewsletterAceita] = useState(true)\n  const [maisLidas, setMaisLidas] = useState([])\n")
  const effect = `
  useEffect(() => {
    async function carregarMaisLidas() {
      const { data, error } = await supabase.from('article_views').select('article_id,view_count').order('view_count', { ascending: false }).limit(20)
      if (error) return console.error('Erro ao carregar Mais Lidas:', error)
      const byId = new Map((data || []).map(row => [String(row.article_id), Number(row.view_count || 0)]))
      const ranked = articles.filter(a => byId.has(String(a.id))).map(a => ({ ...a, view_count: byId.get(String(a.id)) || 0 })).sort((a,b) => b.view_count - a.view_count)
      setMaisLidas(ranked.slice(0, 5))
    }
    if (articles.length) carregarMaisLidas()
  }, [articles])
`
  s = s.replace("  async function inscreverNewsletter(e)", effect + "\n  async function inscreverNewsletter(e)")
}

// 24h shelf life for recent stories.
if (!s.includes('vg-shelf')) {
  s = s.replace("  const radarImpacto = selecionadas.filter(item => item?.id !== destaque?.id).slice(0, 3)\n", "  const radarImpacto = selecionadas.filter(item => item?.id !== destaque?.id).slice(0, 3)\n  const shelfCutoff = Date.now() - 24 * 3600000\n  const emDestaque = useMemo(() => rankingEditorial(noticiasFiltradas.filter(item => new Date(item?.published_at || item?.created_at || 0).getTime() >= shelfCutoff)).filter(item => item?.id !== destaque?.id).slice(0, 4), [noticiasFiltradas, destaque])\n")
  const shelf = `<section className="vg-section vg-shelf"><div className="vg-section-head"><div><span className="eyebrow">24 HORAS</span><h2>Em destaque</h2></div><span className="live">● HISTÓRIAS QUE AINDA IMPORTAM</span></div><div className="vg-grid">{emDestaque.map(article => <Article key={article.id} article={article} />)}</div></section>`
  s = s.replace('<section className="vg-section vg-impact-section">', shelf + '\n\n      <section className="vg-section vg-impact-section">')
}

// Improve Radar Cripto navigation.
s = s.replace("<button className=\"ghost\" onClick={() => navegar('cripto')}>₿ Radar Cripto</button>", "<button className=\"ghost\" onClick={() => { setActive('cripto'); requestAnimationFrame(() => document.getElementById('radar-cripto')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }}>₿ Radar Cripto</button>")
s = s.replace('<section className="vg-two"><Categoria titulo="₿ Radar Cripto"', '<section className="vg-two" id="radar-cripto"><Categoria titulo="₿ Radar Cripto"')

// AGORA hierarchy: compact status label, stronger live headline, no loose right-side text.
if (!s.includes('vg-agora-polish')) {
  s = s.replace('<span>● AGORA</span><strong>{loading ? \'Atualizando o portal…\' : \'Cobertura em tempo real\'}</strong><small>Informação, contexto e impacto.</small>', '<div className="vg-agora-polish"><span className="agora-dot">●</span><span className="agora-label">AGORA</span><span className="agora-sep">·</span><strong className="agora-copy">{loading ? \'Atualizando o portal…\' : \'Cobertura em tempo real\'}</strong></div>')
}

// Final mobile alignment and typography pass.
const extraCss = `.vg-shelf{border-top:1px solid #e4e7ec}.vg-shelf .vg-section-head{margin-bottom:18px}.vg-agora-polish{display:flex;align-items:baseline;gap:7px;width:100%;min-width:0}.vg-agora-polish .agora-dot{color:#d92d20;font-size:10px;line-height:1;flex:0 0 auto}.vg-agora-polish .agora-label{color:#d92d20;font-size:16px;font-weight:850;letter-spacing:.2px;flex:0 0 auto}.vg-agora-polish .agora-sep{color:#98a2b3;font-size:17px;font-weight:700;flex:0 0 auto}.vg-agora-polish .agora-copy{color:#101828;font-size:20px;font-weight:800;line-height:1.15;min-width:0;overflow-wrap:anywhere}.vg-pro{position:relative;box-sizing:border-box;width:100%;max-width:100%;min-width:0;overflow:hidden;padding:32px clamp(20px,4vw,48px)}.vg-pro>div{min-width:0;max-width:100%;overflow:hidden}.vg-pro h2{max-width:100%;margin:10px 0 16px;line-height:1.08;letter-spacing:-.7px;overflow-wrap:anywhere}.vg-pro p{max-width:100%;margin:0;overflow-wrap:anywhere}.vg-pro button{box-sizing:border-box;max-width:100%;white-space:nowrap}.vg-impact-section .vg-impact h3{font-size:24px;line-height:1.2}.vg-impact-section .vg-impact p{font-size:18px;line-height:1.45}.vg-impact-section .vg-impact strong{font-size:17px}.vg-impact-section .vg-impact a{font-size:16px;font-weight:700}.vg-site,.vg-main,.vg-header,.vg-menu,.vg-section,.vg-hero,.vg-two,.vg-grid,.vg-impact-grid,.vg-markets,.vg-pro,.vg-card,.vg-impact,.vg-lead{box-sizing:border-box;max-width:100%;min-width:0}@media(max-width:760px){html,body,#root{max-width:100%;overflow-x:hidden}.vg-site{width:100%;overflow-x:hidden}.vg-header,.vg-menu{max-width:100%;overflow:hidden}.vg-main{width:100%;max-width:100%;padding-left:16px;padding-right:16px;overflow-x:hidden}.vg-section,.vg-hero,.vg-two{width:100%;margin-left:0;margin-right:0}.vg-grid,.vg-impact-grid,.vg-markets{width:100%;min-width:0}.vg-section-head{gap:12px;align-items:flex-end}.vg-section-head>*,.vg-section-head h2,.vg-section-head button,.vg-section-head .live{min-width:0;max-width:100%}.vg-section-head .live{font-size:12px;white-space:normal;text-align:right}.vg-card,.vg-impact,.vg-lead{min-width:0;overflow:hidden}.vg-card h3,.vg-impact h3,.vg-lead h3{overflow-wrap:anywhere;word-break:normal}.vg-card p,.vg-impact p,.vg-lead p{overflow-wrap:anywhere}.vg-actions{flex-wrap:wrap;width:100%}.vg-actions button{max-width:100%}.vg-agora{width:100%;overflow:hidden}.vg-pro{padding:28px 22px!important}.vg-pro>div{padding:0 22px!important;box-sizing:border-box}.vg-pro h2{font-size:clamp(32px,8.5vw,42px)!important;line-height:1.08!important}.vg-pro p{font-size:18px!important;line-height:1.5!important}.vg-pro button{width:calc(100% - 44px)!important;margin-left:22px!important;margin-right:22px!important;margin-top:24px;padding:16px 14px!important;font-size:17px!important}.vg-impact-section .vg-impact h3{font-size:23px;line-height:1.22}.vg-impact-section .vg-impact p{font-size:18px}.vg-impact-section .vg-impact small{font-size:13px}.vg-impact-section .vg-impact a{font-size:16px;font-weight:700}}@media(max-width:480px){.vg-main{padding-left:14px;padding-right:14px}.vg-section-head{display:block}.vg-section-head .live{display:block;margin-top:8px;text-align:left}.vg-section-head h2{max-width:100%}.vg-agora-polish{gap:5px}.vg-agora-polish .agora-label{font-size:14px}.vg-agora-polish .agora-copy{font-size:19px}.vg-pro{padding:26px 20px!important;border-radius:22px}.vg-pro>div{padding:0 20px!important}.vg-pro h2{font-size:32px!important;line-height:1.1!important;margin:10px 0 14px!important}.vg-pro p{font-size:17px!important}.vg-pro button{width:calc(100% - 40px)!important;margin-left:20px!important;margin-right:20px!important;font-size:16px!important}}@media(max-width:360px){.vg-main{padding-left:12px;padding-right:12px}.vg-agora-polish .agora-label{font-size:13px}.vg-agora-polish .agora-copy{font-size:18px}.vg-pro{padding:24px 18px!important}.vg-pro>div{padding:0 18px!important}.vg-pro h2{font-size:29px!important}}`
s = s.replace('const css = `', 'const css = `' + extraCss)

// Preserve the larger approved mobile typography in the rest of the site.
fs.writeFileSync(path, s)
console.log('Vetor Global mobile alignment, viewport safety, AGORA hierarchy, VETOR PRO safe area and Radar de impacto typography applied')