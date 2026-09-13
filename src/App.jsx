import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const menu = [
  ['todos', '⌂', 'Início'], ['brasil', '🇧🇷', 'Brasil'], ['mundo', '🌎', 'Mundo'], ['mercados', '📈', 'Mercados'],
  ['cripto', '₿', 'Cripto'], ['tecnologia', '🤖', 'Tecnologia'], ['saude', '❤️', 'Saúde'], ['ciencia', '🔬', 'Ciência'],
]
const mercados = [['₿', 'Bitcoin', 'BTC'], ['Ξ', 'Ethereum', 'ETH'], ['$', 'Dólar', 'USD/BRL'], ['📊', 'Ibovespa', 'IBOV'], ['◆', 'Ouro', 'XAU']]
const normalizar = (texto = '') => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const limparTexto = (texto = '') => texto.replace(/&nbsp;|\u00a0/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const limparTitulo = (titulo = '', fonte = '') => { let t = limparTexto(titulo); const f = limparTexto(fonte); if (f) { const e = f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); t = t.replace(new RegExp(`\\s*[|–—-]\\s*${e}\\s*$`, 'i'), '') }; return t.replace(/\s*[|–—-]\s*$/, '').trim() }
const resumoLimpo = (summary = '', titulo = '') => { let s = limparTexto(summary); const t = limparTexto(titulo); if (!s) return ''; const nS = normalizar(s); const nT = normalizar(t); if (nS === nT) return ''; if (nT && nS.startsWith(nT)) s = s.slice(t.length).replace(/^\s*[:|–—-]\s*/, '').trim(); s = s.replace(/\s*(?:[|–—-]\s*)?(?:cnn\s*brasil|cnn|g1|uol|estadão|estadao|folha|valor|money\s*times|portal\s*do\s*bitcoin|brasil\s*247|dw\.com|reuters|bbc)\s*$/i, '').trim(); if (!s || normalizar(s) === nT || s.length < 24) return ''; return s }
const tokens = texto => new Set(normalizar(limparTexto(texto)).split(/[^a-z0-9]+/).filter(w => w.length > 3))
const similaridade = (a, b) => { const A = tokens(a), B = tokens(b); if (!A.size || !B.size) return 0; let inter = 0; A.forEach(x => { if (B.has(x)) inter++ }); return inter / Math.max(1, Math.min(A.size, B.size)) }
const dedupeEditorial = (items = [], categoria = '') => { const aceitas = []; const isCrypto = normalizar(categoria) === 'cripto'; for (const item of items) { const titulo = limparTexto(item?.title || ''); const norm = normalizar(titulo); const dup = aceitas.some(prev => { const pt = limparTexto(prev?.title || ''); if (normalizar(pt) === norm) return true; if (similaridade(titulo, pt) >= (isCrypto ? 0.52 : 0.68)) return true; if (isCrypto && /(bitcoin|btc|ethereum|eth|solana|sol|xrp|bnb|cardano|dogecoin|doge)/i.test(titulo) && /(bitcoin|btc|ethereum|eth|solana|sol|xrp|bnb|cardano|dogecoin|doge)/i.test(pt) && /(inflacao|cpi|ipca|juros|fed|fomc|etf|sec|regulacao|liquidacao|fluxo|halving|hack|exploit|estabilidade|preco)/i.test(titulo) && /(inflacao|cpi|ipca|juros|fed|fomc|etf|sec|regulacao|liquidacao|fluxo|halving|hack|exploit|estabilidade|preco)/i.test(pt)) return true; return false }); if (!dup) aceitas.push(item) } return aceitas }
const fonteEditorial = article => { let source = limparTexto(article?.source?.name || ''); const title = limparTexto(article?.title || ''); if (/^google news/i.test(source)) { const m = title.match(/\s[-|–—]\s([^|–—-]{2,90})\s*$/); if (m?.[1]) source = limparTexto(m[1]) }; return source || 'Fonte' }
const noticiaApresentavel = article => { const source = fonteEditorial(article); return { ...article, displayTitle: limparTitulo(article?.title || '', source) || 'Notícia', displaySummary: resumoLimpo(article?.summary || '', article?.title || ''), displaySource: source } }
const scoreEditorial = article => {
  const title = normalizar(article?.title || '')
  const summary = limparTexto(article?.summary || '')
  const source = normalizar(fonteEditorial(article))
  const published = new Date(article?.published_at || article?.created_at || 0).getTime()
  const ageHours = Math.max(0, (Date.now() - published) / 3600000)
  const freshness = published ? Math.max(0, 34 - Math.min(ageHours, 48) * 0.55) : 0
  const image = article?.image_url ? 9 : 0
  const summaryScore = resumoLimpo(summary, article?.title || '') ? 12 : 0
  const titleScore = title.length >= 35 && title.length <= 150 ? 8 : 4
  const trusted = /(reuters|cnn|bbc|g1|uol|folha|estadao|estadao|valor|bloomberg|associated press|ap news|money times|portal do bitcoin)/i.test(source) ? 9 : 4
  const impact = /(governo|presidente|congresso|supremo|fed|juros|inflacao|ipca|dolar|bitcoin|ethereum|etf|guerra|ira|israel|china|eua|trump|petroleo|mercado|banco central|ia|inteligencia artificial|regulacao|crise|eleicao)/i.test(title) ? 8 : 0
  return freshness + image + summaryScore + titleScore + trusted + impact
}
const rankingEditorial = items => [...items].sort((a, b) => { const score = scoreEditorial(b) - scoreEditorial(a); if (Math.abs(score) > 1) return score; return new Date(b?.published_at || b?.created_at || 0) - new Date(a?.published_at || a?.created_at || 0) })
const impactoEditorial = article => {
  const t = normalizar(article?.title || '')
  if (/(juros|fed|inflacao|ipca|dolar|banco central)/i.test(t)) return ['MERCADOS', 'Pode alterar expectativas de juros, câmbio e ativos.']
  if (/(bitcoin|btc|ethereum|eth|solana|xrp|cripto|etf)/i.test(t)) return ['CRIPTO', 'Pode mudar o sentimento e o fluxo de capital nos ativos digitais.']
  if (/(guerra|ira|israel|ucrania|russia|china|eua|trump|otan|geopolit)/i.test(t)) return ['GEOPOLÍTICA', 'Pode gerar efeitos sobre comércio, energia e mercados globais.']
  if (/(ia|inteligencia artificial|tecnologia|chip|semicondutor)/i.test(t)) return ['TECNOLOGIA', 'Pode acelerar mudanças em negócios, produtividade e investimentos.']
  if (/(governo|congresso|supremo|eleicao|brasil|presidente)/i.test(t)) return ['BRASIL', 'Pode influenciar decisões econômicas, políticas públicas e negócios.']
  return ['IMPACTO', 'Um fato relevante que merece acompanhamento e contexto.']
}
function dataFormatada(data) { if (!data) return ''; return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(data)) }

export default function App() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('todos')
  const [cotacoes, setCotacoes] = useState({})
  const [newsletterNome, setNewsletterNome] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterAceita, setNewsletterAceita] = useState(true)

  useEffect(() => {
    async function carregarCotacoes() {
      const { data, error } = await supabase.functions.invoke('market-quotes')
      if (error) return console.error('Erro ao carregar cotações:', error)
      setCotacoes(Object.fromEntries((data?.quotes ?? []).filter(q => q.price != null).map(q => [q.symbol, q])))
    }
    carregarCotacoes()
    const timer = setInterval(carregarCotacoes, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function carregarNoticias() {
      const { data, error } = await supabase.from('articles').select(`id,title,summary,url,image_url,published_at,created_at,category:categories(id,name,slug),source:sources(name)`).order('published_at', { ascending: false, nullsFirst: false }).limit(50)
      if (!error) setArticles(data || [])
      else console.error('Erro ao carregar notícias:', error)
      setLoading(false)
    }
    carregarNoticias()
  }, [])

  async function inscreverNewsletter(e) {
    e.preventDefault()
    const email = newsletterEmail.trim().toLowerCase()
    const nome = newsletterNome.trim()
    if (!email || !email.includes('@')) return setNewsletterStatus('Digite um e-mail válido.')
    if (!newsletterAceita) return setNewsletterStatus('Marque a opção para receber o Vetor Diário.')
    setNewsletterLoading(true); setNewsletterStatus('')
    const { error } = await supabase.from('newsletter_subscribers').insert({ email, name: nome || null, source: 'website' })
    if (error) { setNewsletterLoading(false); return setNewsletterStatus(error.code === '23505' ? 'Este e-mail já está cadastrado. 👍' : 'Não foi possível concluir agora. Tente novamente.') }
    const { error: emailError } = await supabase.functions.invoke('send-welcome-email', { body: { email, name: nome } })
    if (emailError) console.error('Erro ao enviar e-mail:', emailError)
    setNewsletterLoading(false); setNewsletterNome(''); setNewsletterEmail(''); setNewsletterStatus('Cadastro realizado! Você receberá o Vetor Diário. 🚀')
  }

  const noticiasFiltradas = useMemo(() => {
    const base = active === 'todos' || active === 'mercados' ? articles : articles.filter(a => normalizar(a.category?.slug || '') === normalizar(active))
    return dedupeEditorial(base, active === 'todos' || active === 'mercados' ? '' : active)
  }, [articles, active])
  const cronologicas = useMemo(() => [...noticiasFiltradas].sort((a, b) => new Date(b?.published_at || b?.created_at || 0) - new Date(a?.published_at || a?.created_at || 0)), [noticiasFiltradas])
  const selecionadas = useMemo(() => rankingEditorial(noticiasFiltradas), [noticiasFiltradas])
  const destaque = selecionadas[0]
  const ultimas = cronologicas.filter(item => item?.id !== destaque?.id).slice(0, 6)
  const radarImpacto = selecionadas.filter(item => item?.id !== destaque?.id).slice(0, 3)
  const navegar = categoria => { setActive(categoria); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return <div className="vg-site">
    <style>{css}</style>
    <header className="vg-header">
      <button className="vg-brand" onClick={() => navegar('todos')} aria-label="Ir para o início"><span className="vg-logo">V</span><span><strong>Vetor Global</strong><small>Informações que movem decisões.</small></span></button>
      <button className="vg-now" onClick={() => document.getElementById('agora')?.scrollIntoView({ behavior: 'smooth' })}>● VETOR AGORA</button>
    </header>
    <nav className="vg-menu">{menu.map(([id, icon, nome]) => <button key={id} onClick={() => navegar(id)} className={active === id ? 'ativo' : ''}><span>{icon}</span>{nome}</button>)}</nav>

    <main className="vg-main">
      <section className="vg-agora" id="agora"><span>● AGORA</span><strong>{loading ? 'Atualizando o portal…' : 'Cobertura em tempo real'}</strong><small>Informação, contexto e impacto.</small></section>

      <section className="vg-hero">
        <div className="vg-hero-copy"><span className="eyebrow">Vetor Global • VETOR SELECIONA</span><h1>O que está acontecendo no mundo — e por que isso importa?</h1><p>Notícias relevantes do Brasil e do mundo, com foco nos acontecimentos que podem impactar mercados, economia, tecnologia e criptoativos.</p><div className="vg-actions"><button onClick={() => document.getElementById('ultimas')?.scrollIntoView({ behavior: 'smooth' })}>Ver últimas notícias →</button><button className="ghost" onClick={() => navegar('cripto')}>₿ Radar Cripto</button></div></div>
        {destaque ? <Article article={destaque} destaque /> : <div className="vg-lead-empty">Carregando as principais notícias…</div>}
      </section>

      <section className="vg-section" id="ultimas"><div className="vg-section-head"><div><span className="eyebrow">EM PRIMEIRO LUGAR</span><h2>Últimas notícias</h2></div><button onClick={() => navegar('todos')}>Ver todas →</button></div>{loading ? <div className="vg-empty">Carregando o Vetor Global…</div> : ultimas.length ? <div className="vg-grid">{ultimas.map(article => <Article key={article.id} article={article} />)}</div> : <div className="vg-empty">Ainda não há notícias cadastradas.</div>}</section>

      <section className="vg-section vg-impact-section"><div className="vg-section-head"><div><span className="eyebrow">VETOR SELECIONA</span><h2>Radar de impacto</h2></div><span className="live">● LEITURA EDITORIAL</span></div><div className="vg-impact-grid">{radarImpacto.map(article => { const [tag, reason] = impactoEditorial(article); const item = noticiaApresentavel(article); return <article className="vg-impact" key={article.id}><span className="impact-tag">{tag}</span><h3>{item.displayTitle}</h3><strong>Por que importa</strong><p>{reason}</p><small>{item.displaySource} • {dataFormatada(item.published_at || item.created_at)}</small><a href={`/noticia/${encodeURIComponent(item.id)}`}>Entender o contexto →</a></article> })}</div></section>

      <section className="vg-section" id="mercados"><div className="vg-section-head"><div><span className="eyebrow">VISÃO RÁPIDA</span><h2>Pulso dos mercados</h2></div><span className="live">● ATUALIZAÇÃO AUTOMÁTICA</span></div><div className="vg-markets">{mercados.map(([icone, nome, simbolo]) => { const q = cotacoes[simbolo]; const valor = q?.price != null ? (simbolo === 'USD/BRL' ? 'R$ ' : simbolo === 'IBOV' ? '' : 'US$ ') + Number(q.price).toLocaleString('pt-BR', { minimumFractionDigits: simbolo === 'IBOV' ? 0 : 2, maximumFractionDigits: simbolo === 'IBOV' ? 0 : 2 }) : '—'; return <button key={simbolo} onClick={() => navegar(simbolo === 'BTC' || simbolo === 'ETH' ? 'cripto' : 'mercados')}><span className="market-icon">{icone}</span><span><strong>{nome}</strong><small>{simbolo}</small></span><b>{valor}</b><em>{q?.changePct != null ? `${q.changePct >= 0 ? '+' : ''}${Number(q.changePct).toFixed(2)}%` : 'aguardando dados'}</em></button> })}</div></section>

      <section className="vg-two"><Categoria titulo="₿ Radar Cripto" subtitulo="Ativos digitais e fatos que movimentam o mercado" categoria="cripto" articles={articles} navegar={navegar} /><Categoria titulo="🇧🇷 Brasil" subtitulo="Economia e fatos com impacto local" categoria="brasil" articles={articles} navegar={navegar} /></section>
      <section className="vg-section"><Categoria titulo="🌎 Mundo" subtitulo="Geopolítica, economia e decisões que atravessam fronteiras" categoria="mundo" articles={articles} navegar={navegar} grande /></section>

      <section className="vg-pro"><div><span className="eyebrow">VETOR PRO • EM DESENVOLVIMENTO</span><h2>Mais contexto. Menos ruído.</h2><p>Análises, cenários e leitura de impacto para quem quer entender o que está por trás da notícia.</p></div><button onClick={() => document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' })}>Quero acompanhar →</button></section>

      <section className="vg-newsletter" id="newsletter"><div><span className="eyebrow">VETOR GLOBAL • GRATUITO</span><h2>Receba o Vetor Diário</h2><p>As notícias que realmente importam, mercados, cripto e economia direto no seu e-mail.</p></div><form onSubmit={inscreverNewsletter}><input value={newsletterNome} onChange={e => setNewsletterNome(e.target.value)} placeholder="Seu nome" /><input type="email" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} placeholder="Seu melhor e-mail" required /><label><input type="checkbox" checked={newsletterAceita} onChange={e => setNewsletterAceita(e.target.checked)} /> <span>Quero receber o <strong>Vetor Diário</strong> e novidades do Vetor Global.</span></label><button type="submit" disabled={newsletterLoading}>{newsletterLoading ? 'Enviando…' : 'Quero receber o Vetor Diário'}</button>{newsletterStatus && <small className="status">{newsletterStatus}</small>}</form></section>
    </main>
    <footer><strong>Vetor Global</strong><span>Notícias • Mercados • Cripto • Mundo</span></footer>
  </div>
}

function Article({ article, destaque = false }) {
  const item = noticiaApresentavel(article)
  return <article className={destaque ? 'vg-lead' : 'vg-card'}>
    {item.image_url && <img src={item.image_url} alt="" loading="lazy" />}
    <div className="vg-card-body"><span className="tag">{item.category?.name || 'Notícia'}</span><h3>{item.displayTitle}</h3>{item.displaySummary && <p>{item.displaySummary}</p>}<small>{item.displaySource} • {dataFormatada(item.published_at || item.created_at)}</small>{item.id && <a href={`/noticia/${encodeURIComponent(item.id)}`}>Ler matéria completa ↗</a>}</div>
  </article>
}

function Categoria({ titulo, subtitulo, categoria, articles, navegar, grande }) {
  const noticias = dedupeEditorial(articles.filter(a => normalizar(a.category?.slug || '') === normalizar(categoria)), categoria).slice(0, 4).map(noticiaApresentavel)
  return <div className={grande ? 'vg-category vg-category-wide' : 'vg-category'}><div className="vg-category-head"><div><h2>{titulo}</h2><p>{subtitulo}</p></div><button onClick={() => navegar(categoria)}>Ver todas →</button></div>{noticias.length ? <div className="vg-grid vg-category-grid">{noticias.map(article => <Article key={article.id} article={article} />)}</div> : <div className="vg-empty">Nenhuma notícia desta categoria no momento.</div>}</div>
}

const css = `
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f6f7f9;color:#101828;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.vg-site{min-height:100vh}.vg-header{max-width:1280px;height:82px;margin:auto;padding:0 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e4e7ec}.vg-brand{border:0;background:none;padding:0;display:flex;align-items:center;gap:12px;text-align:left;cursor:pointer;color:#101828}.vg-logo{width:46px;height:46px;border-radius:11px;background:#0b1220;color:#fff;display:grid;place-items:center;font-size:23px;font-weight:900}.vg-brand strong{display:block;font-size:20px}.vg-brand small{display:block;color:#475467;font-size:11px;margin-top:2px}.vg-now{border:0;border-radius:8px;background:#155eef;color:#fff;padding:11px 15px;font-weight:850;cursor:pointer}.vg-menu{max-width:1280px;margin:auto;padding:13px 20px;display:flex;gap:7px;overflow-x:auto;scrollbar-width:none}.vg-menu button{border:1px solid #e4e7ec;background:#fff;color:#344054;border-radius:999px;padding:8px 13px;white-space:nowrap;cursor:pointer}.vg-menu button.ativo{background:#0b1220;color:#fff;border-color:#0b1220}.vg-menu span{margin-right:5px}.vg-main{max-width:1280px;margin:auto;padding:0 20px}.vg-agora{margin-top:8px;display:flex;align-items:center;gap:12px;padding:10px 0;color:#475467;font-size:12px}.vg-agora span{color:#d92d20;font-weight:900}.vg-agora strong{color:#101828}.vg-agora small{margin-left:auto}.vg-hero{display:grid;grid-template-columns:1.08fr .92fr;gap:28px;margin-top:16px}.vg-hero-copy{padding:28px 0 20px}.eyebrow{color:#155eef;font-size:11px;font-weight:900;letter-spacing:1.1px;text-transform:uppercase}.vg-hero h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(42px,5.4vw,72px);line-height:.98;letter-spacing:-2.2px;margin:12px 0 20px;max-width:850px}.vg-hero-copy p{max-width:720px;color:#344054;font-size:17px;line-height:1.65}.vg-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}.vg-actions button,.vg-pro button{border:0;background:#0b1220;color:#fff;border-radius:8px;padding:12px 17px;font-weight:850;cursor:pointer}.vg-actions .ghost{background:#fff;color:#101828;border:1px solid #d0d5dd}.vg-lead{background:#0b1220;color:#fff;border-radius:17px;overflow:hidden;display:flex;flex-direction:column;min-height:330px;box-shadow:0 14px 35px rgba(16,24,40,.10)}.vg-lead img{width:100%;height:175px;object-fit:cover}.vg-card-body{padding:18px}.vg-lead .vg-card-body{padding:25px;display:flex;flex:1;flex-direction:column}.tag{width:max-content;background:#eaf2ff;color:#155eef;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:900;text-transform:uppercase}.vg-card h3,.vg-lead h3{font-family:Georgia,"Times New Roman",serif;font-size:23px;line-height:1.1;margin:12px 0 8px;overflow-wrap:anywhere}.vg-lead h3{font-size:31px;color:#fff}.vg-card p,.vg-lead p{color:#344054;font-size:13px;line-height:1.55;margin:0}.vg-lead p{color:#c9d3df}.vg-card small,.vg-lead small{display:block;color:#667085;font-size:11px;margin-top:12px}.vg-lead small{color:#98a2b3}.vg-card a,.vg-lead a{display:inline-block;margin-top:10px;color:#155eef;font-size:12px;font-weight:900;text-decoration:none}.vg-lead a{margin-top:auto}.vg-section{margin-top:48px}.vg-section-head,.vg-category-head{display:flex;align-items:end;justify-content:space-between;gap:15px;margin-bottom:17px}.vg-section-head h2,.vg-category-head h2{font-family:Georgia,"Times New Roman",serif;font-size:35px;margin:5px 0 0}.vg-section-head button,.vg-category-head button{border:0;background:none;color:#155eef;font-weight:850;cursor:pointer}.live{color:#067647;font-size:11px;font-weight:900}.vg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.vg-card{background:#fff;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden;min-width:0;box-shadow:0 4px 15px rgba(16,24,40,.035)}.vg-card img{width:100%;height:155px;object-fit:cover;display:block;background:#eaecf0}.vg-markets{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.vg-markets button{border:1px solid #e4e7ec;background:#fff;border-radius:12px;padding:15px;text-align:left;display:grid;grid-template-columns:30px 1fr auto;gap:7px;align-items:center;cursor:pointer}.market-icon{font-size:19px}.vg-markets strong{display:block;font-size:13px}.vg-markets small{display:block;color:#667085;font-size:10px}.vg-markets b{font-size:13px;white-space:nowrap}.vg-markets em{grid-column:2/4;color:#067647;font-size:11px;font-style:normal}.vg-two{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:48px}.vg-category{background:#fff;border:1px solid #e4e7ec;border-radius:16px;padding:22px}.vg-category-wide{max-width:none}.vg-category-head{align-items:start}.vg-category-head h2{margin:0}.vg-category-head p{margin:6px 0 0;color:#475467;font-size:12px}.vg-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.vg-empty{background:#fff;border:1px solid #e4e7ec;border-radius:12px;padding:25px;color:#475467}.vg-impact-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.vg-impact{background:#fff;border:1px solid #e4e7ec;border-radius:14px;padding:20px;min-width:0}.impact-tag{display:inline-flex;border-radius:999px;background:#eef4ff;color:#155eef;padding:5px 9px;font-size:10px;font-weight:900;letter-spacing:.7px}.vg-impact h3{font-family:Georgia,"Times New Roman",serif;font-size:22px;line-height:1.18;margin:12px 0 15px;overflow-wrap:anywhere}.vg-impact strong{font-size:12px;color:#101828}.vg-impact p{font-size:14px;line-height:1.5;color:#475467;margin:5px 0 12px}.vg-impact small{display:block;color:#667085;font-size:11px}.vg-impact a{display:inline-block;margin-top:12px;color:#155eef;font-size:12px;font-weight:900;text-decoration:none}.vg-pro{margin-top:48px;border-radius:17px;background:#111827;color:#fff;padding:32px;display:flex;justify-content:space-between;align-items:center;gap:20px;overflow:hidden}.vg-pro h2{font-family:Georgia,"Times New Roman",serif;font-size:37px;margin:8px 0}.vg-pro p{color:#c9d3df;margin:0;max-width:650px;line-height:1.5}.vg-newsletter{margin:48px 0 35px;background:#0b1f33;color:#fff;border-radius:17px;padding:38px;display:grid;grid-template-columns:1fr 1fr;gap:30px}.vg-newsletter h2{font-family:Georgia,"Times New Roman",serif;font-size:40px;margin:8px 0}.vg-newsletter p{color:#c9d3df;line-height:1.55}.vg-newsletter form{display:grid;gap:10px}.vg-newsletter input[type=email],.vg-newsletter form>input{width:100%;padding:13px;border-radius:8px;border:1px solid #34495e}.vg-newsletter label{font-size:12px;color:#c9d3df;line-height:1.4}.vg-newsletter button{border:0;border-radius:8px;background:#155eef;color:#fff;padding:13px;font-weight:900;cursor:pointer}.status{color:#b9f6d0}.vg-newsletter .eyebrow{color:#84adff}footer{max-width:1280px;margin:auto;padding:25px 20px 42px;border-top:1px solid #e4e7ec;color:#667085;font-size:12px;display:flex;justify-content:space-between}
@media(max-width:760px){.vg-header{height:70px;padding:0 12px}.vg-logo{width:40px;height:40px;font-size:20px}.vg-brand strong{font-size:17px}.vg-brand small{font-size:9px}.vg-now{padding:9px 10px;font-size:10px}.vg-menu{padding:10px 12px}.vg-menu button{padding:7px 11px;font-size:12px}.vg-main{padding:0 12px}.vg-agora{font-size:11px;gap:8px}.vg-agora small{display:none}.vg-hero{grid-template-columns:1fr;gap:13px;margin-top:8px}.vg-hero-copy{padding:18px 0 4px}.vg-hero h1{font-size:42px;letter-spacing:-1.5px}.vg-hero-copy p{font-size:15px;line-height:1.55}.vg-lead{min-height:0}.vg-lead img{height:190px}.vg-lead h3{font-size:28px}.vg-section,.vg-two{margin-top:35px}.vg-section-head h2,.vg-category-head h2{font-size:31px}.vg-grid{grid-template-columns:1fr;gap:12px}.vg-card img{height:190px}.vg-card h3{font-size:25px}.vg-card p{font-size:17px;line-height:1.52}.vg-markets{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.vg-markets button{padding:13px;grid-template-columns:26px 1fr;gap:5px}.vg-markets b{grid-column:1/3;font-size:14px}.vg-markets em{grid-column:1/3}.vg-impact-grid{grid-template-columns:1fr;gap:12px}.vg-impact{padding:18px}.vg-impact h3{font-size:23px}.vg-impact p{font-size:16px}.vg-two{grid-template-columns:1fr;gap:12px}.vg-category{padding:16px}.vg-category-grid{grid-template-columns:1fr}.vg-category-grid .vg-card img{height:175px}.vg-pro{margin-top:35px;padding:25px;display:block}.vg-pro h2{font-size:32px;line-height:1.08}.vg-pro p{font-size:17px;line-height:1.55}.vg-pro button{margin-top:18px}.vg-newsletter{margin:35px 0 25px;padding:25px 18px;grid-template-columns:1fr;gap:10px}.vg-newsletter h2{font-size:34px}footer{padding:22px 12px 35px;display:block}footer span{display:block;margin-top:6px}}
@media(max-width:480px){.vg-hero h1{font-size:36px;line-height:1.04}.vg-section-head h2,.vg-category-head h2{font-size:28px}.vg-card h3{font-size:22px}.vg-card p{font-size:18px}.vg-impact h3{font-size:22px}.vg-pro{padding:24px 20px}.vg-pro .eyebrow{display:block;line-height:1.35}.vg-pro h2{font-size:30px;margin:10px 0 13px}.vg-pro p{font-size:17px}.vg-pro button{width:100%;padding:14px 16px;font-size:15px}.vg-newsletter h2{font-size:32px}}
@media(max-width:360px){.vg-brand strong{font-size:15px}.vg-brand small{font-size:10px}.vg-now{font-size:9px}.vg-hero h1{font-size:32px}.vg-card h3{font-size:21px}.vg-pro h2{font-size:28px}.vg-pro p{font-size:16px}.vg-markets{grid-template-columns:1fr}}
`