import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')

// Editorial rule: use real photographic imagery, never generic SVG/category flags.
const replacements = {
  '/editorial/fallback-economia.svg': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=85',
  '/editorial/fallback-mundo.svg': 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1400&q=85',
  '/editorial/fallback-tecnologia.svg': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1400&q=85',
  '/editorial/fallback-cripto.svg': 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1400&q=85',
  '/editorial/fallback-brasil.svg': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1400&q=85'
}
for (const [from, to] of Object.entries(replacements)) s = s.split(from).join(to)

const helper = `
const imagemEditorial = article => {
  const titulo = normalizar(article?.title || '')
  const atual = String(article?.image_url || '')
  if (atual && !/fallback|\\.svg($|\\?)/i.test(atual)) return atual
  const fotos = [
    [/alho|nutri[cç][aã]o|sa[uú]de|medicina/i, 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=1400&q=85'],
    [/deutsche bank|cust[oó]dia.*bitcoin|cust[oó]dia.*ethereum/i, 'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1400&q=85'],
    [/crypto\\.com|conta em reais|cripto.*brasil/i, 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1400&q=85'],
    [/bitcoin|btc|ethereum|eth|solana|cripto|etf|ativos digitais/i, 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1400&q=85'],
    [/equipotel|intelig[eê]ncia artificial|\\bia\\b|tecnologia|chip/i, 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1400&q=85'],
    [/juros reais|juros|infla[cç][aã]o|d[oó]lar|economia|mercado financeiro/i, 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=85'],
    [/pokemon|game|jogo|esport/i, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=85'],
    [/avenida brasil|karol|entretenimento|televis/i, 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=85'],
    [/china|eua|estados unidos|geopolit|com[eé]rcio global/i, 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1400&q=85'],
    [/brasil|governo|pol[ií]tica/i, 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1400&q=85']
  ]
  const achada = fotos.find(([reg]) => reg.test(titulo))
  if (achada) return achada[1]
  const categoria = normalizar(article?.category?.slug || article?.category?.name || '')
  if (categoria === 'tecnologia') return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85'
  if (categoria === 'cripto') return 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1400&q=85'
  if (categoria === 'saude') return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=85'
  if (categoria === 'economia' || categoria === 'mercados') return 'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1400&q=85'
  return 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=85'
}
`

if (!s.includes('const imagemEditorial = article =>')) {
  s = s.replace(/\nfunction Article\(/, `\n${helper}\nfunction Article(`)
}

s = s.replace(/<img src=\{item\.image_url\}/g, '<img src={imagemEditorial(item)}')
fs.writeFileSync(path, s)
console.log('Vetor Global: photographic editorial images enforced')
