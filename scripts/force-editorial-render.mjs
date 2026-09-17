import fs from 'node:fs'

const path = 'src/App.jsx'
let source = fs.readFileSync(path, 'utf8')

// Use a uniquely named resolver so earlier category-only fallbacks cannot shadow it.
const helper = `\nconst resolverImagemEditorial = article => {\n  const title = normalizar(article?.title || '')\n  const category = normalizar(article?.category?.slug || article?.category?.name || '')\n  const rules = [\n    [/alho|nutricao|aliment|saude|medicina/, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1400&q=85'],\n    [/bitcoin|btc|ethereum|eth|solana|cripto|etf|blockchain|xrp/, 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1400&q=85'],\n    [/dolar|juros|inflacao|economia|mercado|ibovespa|comercio|vendas/, 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=85'],\n    [/tecnologia|inteligencia artificial|\\bia\\b|chip|software/, 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1400&q=85'],\n    [/china|eua|estados unidos|guerra|geopolit|internacional|relacoes comerciais/, 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1400&q=85'],\n    [/avenida brasil|karol|televis|entretenimento|novela|globo/, 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=85'],\n    [/futebol|esporte|copa|jogador|atleta/, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1400&q=85']\n  ]\n  const match = rules.find(([pattern]) => pattern.test(title))\n  if (match) return match[1]\n  if (category === 'cripto') return rules[1][1]\n  if (category === 'economia' || category === 'mercados') return rules[2][1]\n  if (category === 'tecnologia') return rules[3][1]\n  if (category === 'saude' || category === 'ciencia') return rules[0][1]\n  if (category === 'mundo') return rules[4][1]\n  return 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=85'\n}\n`

if (!source.includes('const resolverImagemEditorial = article =>')) {
  source = source.replace(/\nfunction Article\(/, `${helper}\nfunction Article(`)
}

source = source.replace(/<img src=\{item\.image_url\}/g, '<img src={resolverImagemEditorial(item)}')
source = source.replace(/<img src=\{article\.image_url\}/g, '<img src={resolverImagemEditorial(article)}')

fs.writeFileSync(path, source)
console.log('Title-aware editorial image resolver connected')
