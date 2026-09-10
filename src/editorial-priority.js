function normalize(text = '') {
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const priorityRules = [
  [/juros|selic|fed|fomc|inflacao|inflação|ipca|pib|fiscal|divida|dívida|banco central|copom|taxa/, 12],
  [/dolar|dólar|real|cambio|câmbio|ibovespa|bolsa|mercado|petroleo|petróleo|ouro|commodit/, 11],
  [/bitcoin|btc|ethereum|eth|cripto|crypto|etf/, 11],
  [/guerra|israel|ira|irã|ucrania|ucrânia|russia|rússia|china|eua|estados unidos|trump|oriente medio|oriente médio|otan/, 10],
  [/ia|inteligencia artificial|inteligência artificial|openai|nvidia|tecnologia|chip/, 8],
  [/governo|congresso|planalto|stf|eleicao|eleição|politica|política/, 7],
]

function scoreCard(article) {
  const title = normalize(article.querySelector('h3')?.textContent || article.querySelector('h2')?.textContent || '')
  const summary = normalize(article.querySelector('p')?.textContent || '')
  let score = 0
  for (const [rule, points] of priorityRules) {
    if (rule.test(title)) score += points
    else if (rule.test(summary)) score += Math.round(points * 0.45)
  }
  if (article.querySelector('img')) score += 3
  const meta = normalize(article.querySelector('small')?.textContent || '')
  if (/reuters|valor|exame|bbc|bloomberg|associated press|agencia brasil/.test(meta)) score += 2
  return score
}

function enhance() {
  const section = document.querySelector('#pulso-agora')
  const grid = section?.querySelector('.noticiasGrid')
  if (!grid) return
  const cards = [...grid.querySelectorAll(':scope > article')]
  if (cards.length < 2) return

  cards.sort((a, b) => scoreCard(b) - scoreCard(a)).forEach(card => grid.appendChild(card))

  cards.forEach((card, index) => {
    const body = card.querySelector('.cardCorpo') || card.lastElementChild
    if (!body || body.querySelector('.vetor-editorial-signal')) return
    const signal = document.createElement('span')
    signal.className = 'vetor-editorial-signal'
    signal.textContent = index === 0 ? 'EM FOCO' : 'VETOR'
    signal.setAttribute('aria-label', index === 0 ? 'Notícia em foco' : 'Notícia selecionada pelo Vetor Global')
    body.prepend(signal)
  })
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance)
else enhance()
const observer = new MutationObserver(() => enhance())
observer.observe(document.body, { childList: true, subtree: true })
setTimeout(() => observer.disconnect(), 15000)
