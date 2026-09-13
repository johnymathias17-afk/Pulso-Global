import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')
s = s.replaceAll('Informação que move decisões.', 'Informações que movem decisões.')
// Improve mobile readability without changing the premium visual hierarchy.
s = s.replaceAll("color: '#667085', fontSize: '11px'", "color: '#475467', fontSize: '11px', fontWeight: '500'")
s = s.replaceAll("color: '#475467', fontSize: '17px'", "color: '#344054', fontSize: '17px', fontWeight: '500'")
s = s.replaceAll("color: '#475467', fontSize: '16px'", "color: '#344054', fontSize: '16px', fontWeight: '500'")
s = s.replaceAll("color: '#667085'", "color: '#475467'")
s = s.replaceAll("color: '#98A2B3'", "color: '#667085'")

// Editorial intelligence: select the strongest lead without sacrificing chronological 'Últimas'.
if (!s.includes('const scoreEditorial =')) {
  const intelligence = `\nconst scoreEditorial = article => {\n  const title = String(article?.title || '').replace(/<[^>]*>/g, ' ').trim()\n  const summary = String(article?.summary || '').replace(/<[^>]*>/g, ' ').trim()\n  const source = String(article?.source?.name || '').toLowerCase()\n  const published = new Date(article?.published_at || article?.created_at || 0).getTime()\n  const ageHours = Number.isFinite(published) ? Math.max(0, (Date.now() - published) / 36e5) : 999\n  const freshness = Math.max(0, 34 - Math.min(ageHours, 34))\n  const image = article?.image_url ? 9 : 0\n  const summaryScore = summary.length >= 80 ? 12 : summary.length >= 40 ? 7 : 0\n  const titleScore = title.length >= 35 && title.length <= 120 ? 8 : title.length > 20 ? 4 : 0\n  const trusted = /(reuters|bbc|cnn brasil|cnn|uol|folha|valor|estadao|estadão|g1|agencia brasil|bloomberg|financial times|money times|portal do bitcoin)/i.test(source) ? 9 : 4\n  const impact = /(fed|fomc|juros|inflacao|ipca|cpi|dolar|ibovespa|bitcoin|ethereum|cripto|guerra|petroleo|petróleo|stf|governo|congresso|eleicao|eleição|tarifa|china|eua|ia|inteligencia artificial|tecnologia)/i.test(title + ' ' + summary) ? 8 : 0\n  return freshness + image + summaryScore + titleScore + trusted + impact\n}\nconst selecionarDestaque = items => [...items].sort((a, b) => { const diff = scoreEditorial(b) - scoreEditorial(a); if (diff) return diff; return new Date(b?.published_at || b?.created_at || 0) - new Date(a?.published_at || a?.created_at || 0) })\n`
  s = s.replace("function dataFormatada(data)", intelligence + "function dataFormatada(data)")
  s = s.replace("const apresentaveis = noticiasFiltradas.map(noticiaApresentavel)\n  const destaque = apresentaveis[0]\n  const ultimas = apresentaveis.slice(1, 7)", "const apresentaveis = noticiasFiltradas.map(noticiaApresentavel)\n  const destaque = selecionarDestaque(noticiasFiltradas).map(noticiaApresentavel)[0]\n  const ultimas = apresentaveis.filter(article => article.id !== destaque?.id).slice(0, 6)")
}

// Make the hero communicate that the lead is an editorial selection.
s = s.replaceAll('Vetor Global • AGORA</span>', 'Vetor Global • VETOR SELECIONA</span>')
fs.writeFileSync(path, s)
console.log('Brand, readability and editorial intelligence patch applied')
