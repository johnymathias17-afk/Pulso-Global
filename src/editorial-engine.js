const normalize = (text = '') => String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

const STOPWORDS = new Set('a o os as um uma uns umas de da do das dos em no na nos nas para por com sem que e ou ao aos à às se sua seu suas seus foi sao são ser ter tem mais menos sobre entre como depois antes durante contra pelo pela pelos pelas este esta isto isso ele ela eles elas governo mundo brasil mercado noticia notícias hoje ontem'.split(' '))
const tokens = text => normalize(text).split(' ').filter(t => t.length > 2 && !STOPWORDS.has(t))

function similarity(a, b) {
  const A = new Set(tokens(a)); const B = new Set(tokens(b))
  if (!A.size || !B.size) return 0
  let common = 0
  A.forEach(t => { if (B.has(t)) common++ })
  return common / Math.min(A.size, B.size)
}

const impactRules = [
  [/selic|juros|fed|fomc|inflacao|ipca|pib|fiscal|divida|banco central|copom|taxa/, 16],
  [/dolar|cambio|ibovespa|bolsa|petroleo|ouro|commodit|economia/, 15],
  [/bitcoin|btc|ethereum|eth|cripto|crypto|etf/, 14],
  [/guerra|israel|ira|ucrania|russia|china|eua|estados unidos|trump|otan|oriente medio/, 13],
  [/ia|inteligencia artificial|openai|nvidia|chip|tecnologia/, 10],
  [/governo|congresso|planalto|stf|eleicao|politica/, 8],
]

const sourceWeight = /reuters|bloomberg|valor economico|valor|exame|bbc|associated press|agencia brasil|financial times|cnbc/i

function score(card, index) {
  const title = card.querySelector('h3,h2')?.textContent || ''
  const summary = card.querySelector('p')?.textContent || ''
  const meta = card.querySelector('small')?.textContent || ''
  const text = `${title} ${summary}`
  let value = 0
  impactRules.forEach(([rule, points]) => { if (rule.test(normalize(text))) value += points })
  if (sourceWeight.test(meta)) value += 4
  if (card.querySelector('img')) value += 2
  const time = card.querySelector('small')?.textContent || ''
  if (/\b(agora|hoje|há poucos minutos|h[aá] [0-9]{1,2} min)/i.test(time)) value += 4
  value += Math.max(0, 5 - index * 0.35)
  return value
}

function dedupeAndRank(grid) {
  const cards = [...grid.querySelectorAll(':scope > article')]
  const kept = []
  cards.forEach(card => {
    const title = card.querySelector('h3,h2')?.textContent || ''
    if (!title) return
    if (kept.some(existing => similarity(title, existing.querySelector('h3,h2')?.textContent || '') >= 0.72)) {
      card.remove()
      return
    }
    kept.push(card)
  })
  kept.sort((a, b) => score(b, cards.indexOf(b)) - score(a, cards.indexOf(a)))
  kept.forEach(card => grid.appendChild(card))
  kept.forEach((card, index) => {
    const body = card.querySelector('.cardCorpo') || card.lastElementChild
    if (!body || body.querySelector('.vetor-editorial-signal')) return
    const signal = document.createElement('span')
    signal.className = 'vetor-editorial-signal'
    signal.textContent = index === 0 ? 'EM FOCO' : 'SELEÇÃO VETOR'
    body.prepend(signal)
  })
}

function isMarketArticle(card) {
  const title = normalize(card.querySelector('h3,h2')?.textContent || '')
  const summary = normalize(card.querySelector('p')?.textContent || '')
  const category = normalize(card.querySelector('.tag')?.textContent || '')
  return /mercad|econom|financ|cripto|bitcoin|ethereum|dolar|cambio|ibovespa|bolsa|ouro|petroleo|commodit|selic|juros/.test(`${category} ${title} ${summary}`)
}

function installMarketFilter() {
  const nav = document.querySelector('nav')
  const marketButton = [...(nav?.querySelectorAll('button') || [])].find(b => normalize(b.textContent).includes('mercados'))
  const grid = document.querySelector('#pulso-agora .noticiasGrid')
  if (!marketButton || !grid || marketButton.dataset.vetorMarketBound) return
  marketButton.dataset.vetorMarketBound = '1'
  marketButton.addEventListener('click', () => {
    setTimeout(() => {
      const cards = [...grid.querySelectorAll(':scope > article')]
      cards.forEach(card => { card.style.display = isMarketArticle(card) ? '' : 'none' })
    }, 50)
  })
  const observer = new MutationObserver(() => {
    if (normalize(document.querySelector('nav button[style*="background"]')?.textContent || '') === 'mercados') {
      grid.querySelectorAll(':scope > article').forEach(card => { card.style.display = isMarketArticle(card) ? '' : 'none' })
    }
  })
  observer.observe(grid, { childList: true })
}

function updateMarketTimestamp() {
  const label = document.querySelector('#mercados .atualizacao')
  if (!label) return
  const values = [...document.querySelectorAll('#mercados .valor')].map(el => el.textContent.trim()).filter(v => v && v !== '—')
  if (!values.length) {
    label.textContent = '○ AGUARDANDO COTAÇÕES'
    label.classList.add('vetor-market-stale')
    return
  }
  label.textContent = `● ATUALIZADO ÀS ${new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`
  label.classList.remove('vetor-market-stale')
}

function enhance() {
  const grid = document.querySelector('#pulso-agora .noticiasGrid')
  if (grid && !grid.dataset.vetorEngine) {
    grid.dataset.vetorEngine = '1'
    dedupeAndRank(grid)
  }
  installMarketFilter()
  updateMarketTimestamp()
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance)
else enhance()
const observer = new MutationObserver(enhance)
observer.observe(document.body, { childList: true, subtree: true })
setTimeout(() => observer.disconnect(), 20000)
setInterval(updateMarketTimestamp, 5000)
