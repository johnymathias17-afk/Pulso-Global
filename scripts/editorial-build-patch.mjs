import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')

const oldSource = "const resumoLimpo = (summary = '', titulo = '') => { const s = limparTexto(summary); if (!s || normalizar(s) === normalizar(limparTexto(titulo))) return ''; return s.replace(/\\s*[|–—-]\\s*(brasil\\s*247|dw\\.com|reuters|bbc|cnn)\\s*$/i, '').trim() }\nconst noticiaApresentavel = article => { const source = limparTexto(article?.source?.name || ''); return { ...article, displayTitle: limparTitulo(article?.title || '', source) || 'Notícia', displaySummary: resumoLimpo(article?.summary || '', article?.title || ''), displaySource: source || 'Fonte' } }"
const newSource = `const resumoLimpo = (summary = '', titulo = '') => { const s = limparTexto(summary); if (!s || normalizar(s) === normalizar(limparTexto(titulo))) return ''; return s.replace(/\\s*[|–—-]\\s*(brasil\\s*247|dw\\.com|reuters|bbc|cnn)\\s*$/i, '').trim() }
const tokensEditorial = texto => new Set(normalizar(limparTexto(texto)).split(/[^a-z0-9]+/).filter(w => w.length > 3))
const similaridadeEditorial = (a, b) => { const A = tokensEditorial(a), B = tokensEditorial(b); if (!A.size || !B.size) return 0; let inter = 0; A.forEach(x => { if (B.has(x)) inter++ }); return inter / Math.max(1, Math.min(A.size, B.size)) }
const fonteEditorial = article => { let source = limparTexto(article?.source?.name || ''); const title = limparTexto(article?.title || ''); if (/^google news/i.test(source)) { const m = title.match(/\\s[-|–—]\\s([^|–—-]{2,90})\\s*$/); if (m?.[1]) source = limparTexto(m[1]) } return source || 'Fonte' }
const noticiaApresentavel = article => { const source = fonteEditorial(article); return { ...article, displayTitle: limparTitulo(article?.title || '', source) || 'Notícia', displaySummary: resumoLimpo(article?.summary || '', article?.title || ''), displaySource: source } }
const dedupeEditorial = (items = [], categoria = '') => { const aceitas = []; for (const item of items) { const titulo = limparTexto(item?.title || ''); const norm = normalizar(titulo); const isCrypto = normalizar(categoria) === 'cripto'; const dup = aceitas.some(prev => { const pt = limparTexto(prev?.title || ''); const pn = normalizar(pt); if (pn === norm) return true; const sim = similaridadeEditorial(titulo, pt); if (sim >= (isCrypto ? 0.52 : 0.68)) return true; if (isCrypto) { const crypto = /(bitcoin|\\bbtc\\b|ethereum|\\beth\\b|solana|\\bsol\\b|xrp|bnb|cardano|dogecoin|\\bdoge\\b)/i; const events = /(inflacao|cpi|ipca|juros|fed|fomc|etf|sec|regulacao|liquidacao|fluxo|halving|hack|exploit|estabilidade|preco)/i; const sameAsset = crypto.test(titulo) && crypto.test(pt) && (normalizar(titulo).match(crypto) || normalizar(pt).match(crypto)); const sameEvent = events.test(titulo) && events.test(pt); if (sameAsset && sameEvent) return true } return false }); if (!dup) aceitas.push(item) } return aceitas }
`
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
const newArticle = "{item.id && <a href={`/noticia/${encodeURIComponent(item.id)}`} style={styles.link}>Ler análise ↗</a>}"
if (!s.includes(oldArticle)) throw new Error('article link not found')
s = s.replace(oldArticle, newArticle)

const oldCategory = "function Categoria({ titulo, subtitulo, categoria, articles, navegar, grande }) { const noticias = articles.filter(a => normalizar(a.category?.slug || '') === normalizar(categoria)).slice(0, 4).map(noticiaApresentavel);"
const newCategory = "function Categoria({ titulo, subtitulo, categoria, articles, navegar, grande }) { const noticias = dedupeEditorial(articles.filter(a => normalizar(a.category?.slug || '') === normalizar(categoria)), categoria).slice(0, 4).map(noticiaApresentavel);"
if (!s.includes(oldCategory)) throw new Error('category block not found')
s = s.replace(oldCategory, newCategory)

fs.writeFileSync(path, s)
console.log('Editorial build patch applied')
