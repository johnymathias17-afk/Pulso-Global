const FEATURES = [
  ['Contexto', 'Entenda o que está por trás da notícia.'],
  ['Impacto', 'Veja quem pode ganhar, perder e ser afetado.'],
  ['Cenários', 'Acompanhe os caminhos que podem se abrir a partir daqui.'],
  ['Radar', 'Monitore os fatores que realmente merecem atenção.'],
]

function createElement(tag, attrs = {}, text = '') {
  const el = document.createElement(tag)
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value))
  if (text) el.textContent = text
  return el
}

function mountVetorPro() {
  if (document.getElementById('vetor-pro-teaser')) return true
  const marketSection = document.getElementById('mercados')
  if (!marketSection) return false

  const section = createElement('section', { id: 'vetor-pro-teaser', class: 'vetor-pro-teaser' })
  const inner = createElement('div', { class: 'vetor-pro-inner' })
  const copy = createElement('div', { class: 'vetor-pro-copy' })
  copy.appendChild(createElement('div', { class: 'vetor-pro-eyebrow' }, 'VETOR PRO • EM DESENVOLVIMENTO'))
  copy.appendChild(createElement('h2', { class: 'vetor-pro-title' }, 'Não basta saber o que aconteceu. Entenda o que pode acontecer depois.'))
  copy.appendChild(createElement('p', { class: 'vetor-pro-description' }, 'Estamos construindo uma camada premium de inteligência: análise própria, contexto, impacto, cenários e radar dos mercados — sem cobrar pela notícia.'))

  const features = createElement('div', { class: 'vetor-pro-features' })
  FEATURES.forEach(([title, description]) => {
    const item = createElement('div', { class: 'vetor-pro-feature' })
    item.appendChild(createElement('strong', {}, title))
    item.appendChild(createElement('span', {}, description))
    features.appendChild(item)
  })

  const action = createElement('button', { type: 'button', class: 'vetor-pro-button' }, 'Quero acompanhar o Vetor Pro →')
  action.addEventListener('click', () => document.querySelector('section.newsletter')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))

  copy.appendChild(features)
  copy.appendChild(action)
  inner.appendChild(copy)
  section.appendChild(inner)
  marketSection.insertAdjacentElement('afterend', section)
  return true
}

function startVetorPro() {
  if (mountVetorPro()) return
  const observer = new MutationObserver(() => {
    if (mountVetorPro()) observer.disconnect()
  })
  observer.observe(document.body, { childList: true, subtree: true })
  setTimeout(() => observer.disconnect(), 15000)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startVetorPro)
else startVetorPro()
