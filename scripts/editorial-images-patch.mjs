import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')

const helper = `
const imagemEditorialV2 = article => {
  const texto = normalizar(\`${'${'}article?.title || ''} ${'${'}article?.summary || ''} ${'${'}article?.category?.slug || ''}\`)
  const atual = String(article?.image_url || '')
  const fotos = [
    [/alho|nutri[cç][aã]o|receita|alimento|sa[uú]de|medicina|hospital/, 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=1400&q=85'],
    [/bitcoin|btc|ethereum|eth|solana|xrp|cripto|etf|ativos digitais|blockchain/, 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1400&q=85'],
    [/crypto\\.com|conta em reais|pix.*cripto|cripto.*brasil/, 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1400&q=85'],
    [/deutsche bank|cust[oó]dia|banco|finan[cç]as|mercado financeiro|bolsa|a[cç][oõ]es/, 'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1400&q=85'],
    [/juros|infla[cç][aã]o|ipca|d[oó]lar|c[aâ]mbio|economia|com[eé]rcio|ibovespa/, 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=85'],
    [/intelig[eê]ncia artificial|\\bia\\b|tecnologia|chip|semicondutor|rob[oô]/, 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1400&q=85'],
    [/celular|iphone|aplicativo|software|internet|computador/, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85'],
    [/avenida brasil|karol|entretenimento|televis[aã]o|cinema|ator|atriz|novela/, 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=85'],
    [/futebol|jogo|esporte|pokemon|game|atleta/, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=85'],
    [/china|eua|estados unidos|geopol[ií]tica|guerra|israel|ucr[aâ]nia|r[uú]ssia|trump/, 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1400&q=85'],
    [/brasil|governo|presidente|congresso|pol[ií]tica|elei[cç][aã]o/, 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1400&q=85'],
    [/clima|tempo|enchente|seca|furac[aã]o|meio ambiente/, 'https://images.unsplash.com/photo-1561485132-59468cd0b553?auto=format&fit=crop&w=1400&q=85'],
    [/ci[eê]ncia|pesquisa|universidade|descoberta|espa[cç]o|nasa/, 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=85'],
    [/agro|agricultura|pecu[aá]ria|campo|soja|milho/, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=85']
  ]
  const encontrada = fotos.find(([regex]) => regex.test(texto))
  if (encontrada) return encontrada[1]
  if (atual && !/fallback|\\.svg($|\\?)/i.test(atual)) return atual
  return 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=85'
}
`

if (!s.includes('const imagemEditorialV2 = article =>')) {
  s = s.replace(/\nfunction Article\(/, `\n${helper}\nfunction Article(`)
}

s = s.replace(/imagemEditorial\(item\)/g, 'imagemEditorialV2(item)')
fs.writeFileSync(path, s)
console.log('Vetor Global: article-specific photographic imagery prioritized')
