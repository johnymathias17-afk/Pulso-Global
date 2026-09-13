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
  const trusted = /(reuters|bbc|cnn brasil|cnn|uol|folha|valor|estadao|estadão|g1|agencia brasil|bloomberg|financial times|money times|portal do bitcoin)/i.test(source) ? 9 : 4
  const impact = /(fed|fomc|juros|inflacao|ipca|cpi|dolar|ibovespa|bitcoin|ethereum|cripto|guerra|petroleo|petróleo|stf|governo|congresso|eleicao|eleição|tarifa|china|eua|ia|inteligencia artificial|tecnologia)/i.test(title + ' ' + summary) ? 8 : 0
  return freshness + image + summaryScore + titleScore + trusted + impact
}
const selecionarDestaque = items => [...items].sort((a, b) => { const diff = scoreEditorial(b) - scoreEditorial(a); if (diff) return diff; return new Date(b?.published_at || b?.created_at || 0) - new Date(a?.published_at || a?.created_at || 0) })
`
  s = s.replace("function dataFormatada(data)", intelligence + "function dataFormatada(data)")
  s = s.replace("const apresentaveis = noticiasFiltradas.map(noticiaApresentavel)\n  const destaque = apresentaveis[0]\n  const ultimas = apresentaveis.slice(1, 7)", "const apresentaveis = noticiasFiltradas.map(noticiaApresentavel)\n  const destaque = selecionarDestaque(noticiasFiltradas).map(noticiaApresentavel)[0]\n  const ultimas = apresentaveis.filter(article => article.id !== destaque?.id).slice(0, 6)")
}

// Make the hero communicate that the lead is an editorial selection and the live rail is useful, not a raw count.
s = s.replaceAll('Vetor Global • AGORA</span>', 'Vetor Global • VETOR SELECIONA</span>')
s = s.replaceAll("${noticiasFiltradas.length} notícias em destaque", 'Cobertura em tempo real')

// High-retention discovery rail: a compact 'Mais lidas' module based on the same editorial ranking.
if (!s.includes('vg-most-read')) {
  const mostRead = `<section className="vg-section vg-most-read"><div className="vg-section-head"><div><span className="eyebrow">PARA NÃO PERDER</span><h2>Mais lidas</h2></div><span className="live">● SELEÇÃO EDITORIAL</span></div><div className="vg-most-read-list">{selecionadas.slice(0, 5).map((article, index) => { const item = noticiaApresentavel(article); return <a className="vg-most-read-item" href={"/noticia/" + encodeURIComponent(item.id)} key={item.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.displayTitle}</strong><small>{item.displaySource} • {dataFormatada(item.published_at || item.created_at)}</small></div></a> })}</div></section>`
  s = s.replace('<section className="vg-section" id="mercados">', mostRead + '\n\n      <section className="vg-section" id="mercados">')
  const cssPatch = `.vg-most-read-list{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.vg-most-read-item{display:flex;gap:10px;min-width:0;padding:15px;text-decoration:none;background:#fff;border:1px solid #e4e7ec;border-radius:12px;color:#101828}.vg-most-read-item>span{font-size:24px;font-weight:900;color:#d4a72c;line-height:1}.vg-most-read-item strong{display:block;font-family:Georgia,"Times New Roman",serif;font-size:16px;line-height:1.18}.vg-most-read-item small{display:block;color:#667085;font-size:10px;margin-top:9px}.vg-most-read-item:hover{border-color:#b2ccff;transform:translateY(-1px)}@media(max-width:900px){.vg-most-read-list{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.vg-most-read-list{grid-template-columns:1fr}.vg-most-read-item{padding:14px}.vg-most-read-item strong{font-size:18px}.vg-most-read-item small{font-size:12px}}`
  s = s.replace('const css = `', 'const css = `' + cssPatch)
}

fs.writeFileSync(path, s)
console.log('Brand, readability, editorial intelligence and discovery patch applied')
