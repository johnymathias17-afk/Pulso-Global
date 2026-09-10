function normalize(text = '') {
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

const PRIORITY_TERMS = [
  'banco central', 'selic', 'juros', 'inflacao', 'ipca', 'pib', 'fiscal', 'cambio', 'dolar',
  'ibovespa', 'bolsa', 'bitcoin', 'ethereum', 'cripto', 'fed', 'trump', 'china', 'petroleo',
  'energia', 'guerra', 'israel', 'ira', 'russia', 'ucrania', 'ia', 'inteligencia artificial',
  'tarifa', 'arrecadacao', 'imposto', 'mercado', 'economia', 'eleicao', 'congresso'
]

const BREAKING_TERMS = ['urgente', 'agora', 'acaba de', 'anuncia', 'aprovou', 'decidiu', 'alerta']
const LOW_SIGNAL_TERMS = ['horoscopo', 'entretenimento', 'celebridade', 'fofoca', 'receita', 'agenda cultural']

function relevanceScore(article) {
  const title = normalize(article.querySelector('h3')?.textContent || article.querySelector('h2')?.textContent || '')
  const summary = normalize(article.querySelector('p')?.textContent || '')
  const source = normalize(article.querySelector('small')?.textContent || '')
  let score = 0
  PRIORITY_TERMS.forEach(term => { if (title.includes(term)) score += 4; else if (summary.includes(term)) score += 1 })
  BREAKING_TERMS.forEach(term => { if (title.includes(term)) score += 1 })
  LOW_SIGNAL_TERMS.forEach(term => { if (title.includes(term)) score -= 8 })
  if (article.querySelector('img')) score += 1
  if (source) score += 1
  return score
}

function dedupeSection(section) {
  const seen = new Set()
  section.querySelectorAll('article').forEach(article => {
    const title = normalize(article.querySelector('h3')?.textContent || article.querySelector('h2')?.textContent || '')
    if (!title) return
    if (seen.has(title)) article.remove()
    else seen.add(title)
  })
}

function rankSection(section) {
  const grid = section.querySelector('.noticiasGrid')
  if (!grid || grid.dataset.ranked === 'true') return
  const cards = [...grid.querySelectorAll('article')]
  cards.sort((a, b) => relevanceScore(b) - relevanceScore(a))
  cards.forEach(card => grid.appendChild(card))
  grid.dataset.ranked = 'true'
}

function addVisualSignals() {
  document.querySelectorAll('#pulso-agora article, .categoria article').forEach(article => {
    if (article.dataset.visualEnhanced === 'true') return
    const title = article.querySelector('h3')?.textContent?.trim() || ''
    const score = relevanceScore(article)
    if (score >= 7) article.classList.add('vetor-high-relevance')
    if (article.querySelector('img')) article.classList.add('vetor-has-image')
    if (title) {
      const signal = document.createElement('span')
      signal.className = 'vetor-editorial-signal'
      signal.textContent = score >= 7 ? 'EM FOCO' : 'VETOR'
      const tag = article.querySelector('.tag')
      if (tag) tag.parentNode.insertBefore(signal, tag.nextSibling)
    }
    article.dataset.visualEnhanced = 'true'
  })
}

function run() {
  document.querySelectorAll('#pulso-agora, .categoria, main > section').forEach(section => {
    dedupeSection(section)
    rankSection(section)
  })
  addVisualSignals()
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run)
else run()

const observer = new MutationObserver(() => run())
setTimeout(() => observer.disconnect(), 15000)
observer.observe(document.body, { childList: true, subtree: true })
