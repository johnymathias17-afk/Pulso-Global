import { supabase } from './supabase'

const SITE = 'https://vetorglobal.com.br'
const seen = new Set()

function clean(value = '') {
  return String(value).replace(/&nbsp;|\u00a0/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
}

function addJsonLd(data) {
  const old = document.getElementById('vetor-seo-jsonld')
  if (old) old.remove()
  const script = document.createElement('script')
  script.id = 'vetor-seo-jsonld'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

function enhanceHome(articles) {
  if (location.pathname !== '/') return
  const itemList = articles.slice(0, 10).map((article, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE}/noticia/${encodeURIComponent(article.id)}`,
    name: article.title || 'Notícia',
  }))
  addJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vetor Global',
    url: SITE,
    description: 'Notícia → contexto → impacto.',
    publisher: { '@type': 'Organization', name: 'Vetor Global', url: `${SITE}/` },
    potentialAction: { '@type': 'SearchAction', target: `${SITE}/?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    mainEntity: { '@type': 'ItemList', itemListElement: itemList },
  })

  const cards = [...document.querySelectorAll('main article')]
  for (const card of cards) {
    if (card.querySelector('.vetor-internal-link')) continue
    const title = clean(card.querySelector('h3')?.textContent || '')
    if (!title) continue
    const article = articles.find(item => clean(item.title) === title || clean(item.title).includes(title) || title.includes(clean(item.title)))
    if (!article?.id) continue
    const link = document.createElement('a')
    link.className = 'vetor-internal-link'
    link.href = `/noticia/${encodeURIComponent(article.id)}`
    link.textContent = 'Abrir no Vetor Global →'
    link.setAttribute('aria-label', `Abrir contexto de ${article.title}`)
    link.style.cssText = 'display:inline-block;margin-top:9px;color:#155eef;font-size:12px;font-weight:800;text-decoration:none'
    card.querySelector('div:last-child')?.appendChild(link)
  }
}

async function load() {
  if (location.pathname !== '/') return
  const { data, error } = await supabase.from('articles').select('id,title,summary,published_at,created_at').order('published_at', { ascending: false, nullsFirst: false }).limit(50)
  if (error || !data?.length) return
  const run = () => enhanceHome(data)
  run()
  const observer = new MutationObserver(run)
  observer.observe(document.body, { childList: true, subtree: true })
  setTimeout(() => observer.disconnect(), 12000)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load)
else load()
