import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')

const oldSource = "const resumoLimpo = (summary = '', titulo = '') => { const s = limparTexto(summary); if (!s || normalizar(s) === normalizar(limparTexto(titulo))) return ''; return s.replace(/\\s*[|–—-]\\s*(brasil\\s*247|dw\\.com|reuters|bbc|cnn)\\s*$/i, '').trim() }\nconst noticiaApresentavel = article => { const source = limparTexto(article?.source?.name || ''); return { ...article, displayTitle: limparTitulo(article?.title || '', source) || 'Notícia', displaySummary: resumoLimpo(article?.summary || '', article?.title || ''), displaySource: source || 'Fonte' } }"
const newSource = `const resumoLimpo = (summary = '', titulo = '') => { let s = limparTexto(summary); const t = limparTexto(titulo); if (!s) return ''; const nS = normalizar(s); const nT = normalizar(t); if (nS === nT) return ''; if (nT && nS.startsWith(nT)) s = s.slice(t.length).replace(/^\\s*[:|–—-]\\s*/, '').trim(); s = s.replace(/\\s*(?:[|–—-]\\s*)?(?:cnn\\s*brasil|cnn|g1|uol|estadão|estadao|folha|valor|money\\s*times|portal\\s*do\\s*bitcoin|brasil\\s*247|dw\\.com|reuters|bbc)\\s*$/i, '').trim(); if (!s || normalizar(s) === nT || s.length < 24) return ''; return s }\nconst tokensEditorial = texto => new Set(normalizar(limparTexto(texto)).split(/[^a-z0-9]+/).filter(w => w.length > 3))\nconst similaridadeEditorial = (a, b) => { const A = tokensEditorial(a), B = tokensEditorial(b); if (!A.size || !B.size) return 0; let inter = 0; A.forEach(x => { if (B.has(x)) inter++ }); return inter / Math.max(1, Math.min(A.size, B.size)) }\nconst fonteEditorial = article => { let source = limparTexto(article?.source?.name || ''); const title = limparTexto(article?.title || ''); if (/^google news/i.test(source)) { const m = title.match(/\\s[-|–—]\\s([^|–—-]{2,90})\\s*$/); if (m?.[1]) source = limparTexto(m[1]) } return source || 'Fonte' }\nconst noticiaApresentavel = article => { const source = fonteEditorial(article); return { ...article, displayTitle: limparTitulo(article?.title || '', source) || 'Notícia', displaySummary: resumoLimpo(article?.summary || '', article?.title || ''), displaySource: source } }\nconst dedupeEditorial = (items = [], categoria = '') => { const aceitas = []; for (const item of items) { const titulo = limparTexto(item?.title || ''); const norm = normalizar(titulo); const isCrypto = normalizar(categoria) === 'cripto'; const dup = aceitas.some(prev => { const pt = limparTexto(prev?.title || ''); const pn = normalizar(pt); if (pn === norm) return true; const sim = similaridadeEditorial(titulo, pt); if (sim >= (isCrypto ? 0.52 : 0.68)) return true; if (isCrypto) { const crypto = /(bitcoin|\\bbtc\\b|ethereum|\\beth\\b|solana|\\bsol\\b|xrp|bnb|cardano|dogecoin|\\bdoge\\b)/i; const events = /(inflacao|cpi|ipca|juros|fed|fomc|etf|sec|regulacao|liquidacao|fluxo|halving|hack|exploit|estabilidade|preco)/i; if (crypto.test(titulo) && crypto.test(pt) && events.test(titulo) && events.test(pt)) return true } return false }); if (!dup) aceitas.push(item) } return aceitas }\n`
if (!s.includes(oldSource)) throw new Error('source block not found')
s = s.replace(oldSource, newSource)

const oldFilter = "const noticiasFiltradas = useMemo(() => active === 'todos' || active === 'mercados' ? articles : articles.filter(a => normalizar(a.category?.slug || '') === normalizar(active)), [articles, active])"
const newFilter = "const noticiasFiltradas = useMemo(() => { const base = active === 'todos' || active === 'mercados' ? articles : articles.filter(a => normalizar(a.category?.slug || '') === normalizar(active)); return dedupeEditorial(base, active === 'todos' || active === 'mercados' ? '' : active) }, [articles, active])"
if (!s.includes(oldFilter)) throw new Error('filter block not found')
s = s.replace(oldFilter, newFilter)

const oldHero = "{destaque.url && <a href={destaque.url} target=\"_blank\" rel=\"noreferrer\" style={styles.link}>Ler notícia original ↗</a>}"
const newHero = "{destaque.id && <a href={`/noticia/${encodeURIComponent(destaque.id)}`} style={styles.link}>Ler análise do Vetor Global ↗</a>}"
if (!s.includes(oldHero)) throw new Error('hero link not found')
s = s.replace(oldHero, newHero)

const oldArticle = "{item.url && <a href={item.url} target=\"_blank\" rel=\"noreferrer\" style={styles.link}>Ler mais ↗</a>}"
const newArticle = "{item.id && <a href={`/noticia/${encodeURIComponent(item.id)}`} style={styles.link}>Ler matéria completa ↗</a>}"
if (!s.includes(oldArticle)) throw new Error('article link not found')
s = s.replace(oldArticle, newArticle)

const oldCategory = "function Categoria({ titulo, subtitulo, categoria, articles, navegar, grande }) { const noticias = articles.filter(a => normalizar(a.category?.slug || '') === normalizar(categoria)).slice(0, 4).map(noticiaApresentavel);"
const newCategory = "function Categoria({ titulo, subtitulo, categoria, articles, navegar, grande }) { const noticias = dedupeEditorial(articles.filter(a => normalizar(a.category?.slug || '') === normalizar(categoria)), categoria).slice(0, 4).map(noticiaApresentavel);"
if (!s.includes(oldCategory)) throw new Error('category block not found')
s = s.replace(oldCategory, newCategory)

// Add stable class hooks so the portal can adapt cleanly to phones without changing the desktop design.
s = s.replace('<header style={styles.header}>', '<header className="vg-header" style={styles.header}>')
s = s.replace('<nav style={styles.menu}>', '<nav className="vg-menu" style={styles.menu}>')
s = s.replace('<section style={styles.hero}>', '<section className="vg-hero" style={styles.hero}>')
s = s.replace('<div style={styles.mercadosGrid}>', '<div className="vg-markets-grid" style={styles.mercadosGrid}>')
s = s.replace('<div style={styles.noticiasGrid}>', '<div className="vg-news-grid" style={styles.noticiasGrid}>')
s = s.replace('<section style={styles.duasColunas}>', '<section className="vg-two-cols" style={styles.duasColunas}>')
s = s.replace('<section style={styles.newsletter}>', '<section className="vg-newsletter" style={styles.newsletter}>')
s = s.replace('<main>', '<main className="vg-main">')

// Visual hierarchy: stronger reading contrast while preserving the premium look.
s = s.replace("logoSub: { color: '#667085'", "logoSub: { color: '#475467'")
s = s.replace("descricao: { maxWidth: '700px', color: '#475467'", "descricao: { maxWidth: '700px', color: '#344054'")
s = s.replace("meta: { color: '#667085'", "meta: { color: '#475467'")
s = s.replace("cardTexto: { color: '#475467'", "cardTexto: { color: '#344054'")
s = s.replace("categoriaSubtitulo: { color: '#667085'", "categoriaSubtitulo: { color: '#475467'")
s = s.replace("vazio: { background: '#fff', border: '1px solid #e4e7ec', borderRadius: '12px', padding: '28px', color: '#667085'", "vazio: { background: '#fff', border: '1px solid #e4e7ec', borderRadius: '12px', padding: '28px', color: '#475467'")

// Mobile-first corrections: one-column news, compact market cards, readable type, and less dead space.
const responsiveStyle = `<style>{\`\n@media (max-width: 760px) {\n  .vg-main { width: 100%; }\n  .vg-header { height: 70px !important; }\n  .vg-header .vg-pulso-button { padding: 9px 10px !important; font-size: 10px !important; }\n  .vg-hero { grid-template-columns: 1fr !important; gap: 14px !important; margin-top: 12px !important; }\n  .vg-hero h1 { font-size: 42px !important; letter-spacing: -1px !important; }\n  .vg-hero p { font-size: 15px !important; line-height: 1.5 !important; }\n  .vg-hero .vg-destaque { min-height: 230px !important; padding: 22px !important; }\n  .vg-markets-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 8px !important; }\n  .vg-markets-grid button { padding: 12px !important; }\n  .vg-news-grid { grid-template-columns: 1fr !important; gap: 12px !important; }\n  .vg-news-grid article { min-width: 0 !important; }\n  .vg-news-grid img { height: 190px !important; }\n  .vg-two-cols { grid-template-columns: 1fr !important; gap: 12px !important; margin-top: 34px !important; }\n  .vg-main > section { margin-top: 34px !important; }\n  .vg-main > section:first-child { margin-top: 12px !important; }\n  .vg-newsletter { margin: 34px auto !important; }\n  .vg-newsletter h2 { font-size: 34px !important; }\n  .vg-menu { padding: 10px 0 !important; gap: 6px !important; }\n  .vg-menu button { padding: 7px 11px !important; font-size: 12px !important; }\n}\n@media (min-width: 761px) {\n  .vg-news-grid article { min-width: 0; }\n}\n\`}</style>`
if (!s.includes('vg-mobile-style')) {
  s = s.replace('<main className="vg-main">', `${responsiveStyle}<main className="vg-main">`)
}

fs.writeFileSync(path, s)
console.log('Editorial build patch applied')
