import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')

// Original, rights-safe editorial artwork by section. Existing publisher images remain preferred.
if (!s.includes('const imagemEditorial =')) {
  const helper = `\nconst imagemEditorial = article => {\n  const slug = normalizar(article?.category?.slug || article?.category?.name || '')\n  const mapa = { economia: '/editorial/economia.svg', mercados: '/editorial/economia.svg', mundo: '/editorial/mundo.svg', tecnologia: '/editorial/tecnologia.svg', cripto: '/editorial/cripto.svg', brasil: '/editorial/brasil.svg', saude: '/editorial/brasil.svg', ciencia: '/editorial/tecnologia.svg' }\n  return mapa[slug] || '/editorial/mundo.svg'\n}\n`
  s = s.replace('function dataFormatada(data)', helper + 'function dataFormatada(data)')
}

// Ensure every story has a visual, while preserving a legitimate publisher image when available.
s = s.replace("if (!error) setArticles(data || [])", "if (!error) setArticles((data || []).map(article => ({ ...article, image_url: article.image_url || imagemEditorial(article) })))")

// Keep a story in only one of the two editorial surfaces.
if (s.includes('const emDestaque =') && !s.includes('const emDestaqueIds')) {
  s = s.replace("const radarImpacto = selecionadas.filter(item => item?.id !== destaque?.id).slice(0, 3)", "const emDestaqueIds = new Set(emDestaque.map(item => item?.id))\n  const radarImpacto = selecionadas.filter(item => item?.id !== destaque?.id && !emDestaqueIds.has(item?.id)).slice(0, 3)")
}

fs.writeFileSync(path, s)
console.log('Editorial media patch applied')
