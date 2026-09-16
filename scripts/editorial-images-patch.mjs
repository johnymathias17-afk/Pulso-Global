import fs from 'node:fs'
const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')
const fallback = `(data || []).map(article => ({ ...article, image_url: article.image_url || ({ economia: '/editorial/fallback-economia.svg', mercados: '/editorial/fallback-economia.svg', mundo: '/editorial/fallback-mundo.svg', geopolitica: '/editorial/fallback-mundo.svg', tecnologia: '/editorial/fallback-tecnologia.svg', cripto: '/editorial/fallback-cripto.svg', brasil: '/editorial/fallback-brasil.svg' }[String(article?.category?.slug || article?.category?.name || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')] || '/editorial/fallback-mundo.svg') }))`
if (!s.includes("/editorial/fallback-economia.svg")) {
  s = s.replace(/setArticles\(data \|\| \[\]\)/g, `setArticles(${fallback})`)
}
fs.writeFileSync(path, s)
console.log('Editorial fallback images applied')
