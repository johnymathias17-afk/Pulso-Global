function normalize(text = '') {
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
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

function run() {
  document.querySelectorAll('#pulso-agora, .categoria, main > section').forEach(dedupeSection)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run)
else run()
const observer = new MutationObserver(() => run())
setTimeout(() => observer.disconnect(), 12000)
observer.observe(document.body, { childList: true, subtree: true })
