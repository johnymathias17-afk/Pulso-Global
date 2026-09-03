import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const menu = [
  ['todos', '⌂', 'Início'],
  ['brasil', '🇧🇷', 'Brasil'],
  ['mundo', '🌎', 'Mundo'],
  ['mercados', '📈', 'Mercados'],
  ['cripto', '₿', 'Cripto'],
  ['tecnologia', '🤖', 'Tecnologia'],
  ['saude', '❤️', 'Saúde'],
  ['ciencia', '🔬', 'Ciência'],
]

const mercados = [
  ['₿', 'Bitcoin', 'BTC'],
  ['Ξ', 'Ethereum', 'ETH'],
  ['$', 'Dólar', 'USD/BRL'],
  ['📊', 'Ibovespa', 'IBOV'],
  ['◆', 'Ouro', 'XAU'],
]

const normalizar = (texto = '') =>
  texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

function dataFormatada(data) {
  if (!data) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(data))
}

export default function App() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('todos')
const [cotacoes, setCotacoes] = useState({})
const [mercadosAtualizadosEm, setMercadosAtualizadosEm] = useState(null)
    const [newsletterNome, setNewsletterNome] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)
useEffect(() => {
  async function carregarCotacoes() {
    const { data, error } = await supabase.functions.invoke('market-quotes')

    if (error) {
      console.error('Erro ao carregar cotações:', error)
      return
    }

    const mapa = Object.fromEntries(
      (data?.quotes ?? [])
        .filter(q => q.price != null)
        .map(q => [q.symbol, q])
    )

    setCotacoes(mapa)
    setMercadosAtualizadosEm(new Date())
  }

  carregarCotacoes()

  const timer = setInterval(carregarCotacoes, 60000)

  return () => clearInterval(timer)
}, [])
  async function inscreverNewsletter(e) {
    e.preventDefault()

    const email = newsletterEmail.trim().toLowerCase()
    const nome = newsletterNome.trim()

    if (!email || !email.includes('@')) {
      setNewsletterStatus('Digite um e-mail válido.')
      return
    }

    setNewsletterLoading(true)
    setNewsletterStatus('')

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email,
        name: nome || null,
        source: 'website'
      })

    setNewsletterLoading(false)

    if (error) {
      if (error.code === '23505') {
        setNewsletterStatus('Este e-mail já está cadastrado. 👍')
      } else {
        console.error(error)
        setNewsletterStatus('Não foi possível concluir agora. Tente novamente.')
      }
      return
    }

    setNewsletterNome('')
    setNewsletterEmail('')
    setNewsletterStatus('Cadastro realizado! Você receberá o Pulso Global. 🚀')
  }
  useEffect(() => {
    async function carregarNoticias() {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          summary,
          url,
          image_url,
          published_at,
          created_at,
          category:categories(id,name,slug),
          source:sources(name)
        `)
        .order('published_at', {
          ascending: false,
          nullsFirst: false
        })
        .limit(50)

      if (!error) {
        setArticles(data || [])
      }

      setLoading(false)
    }

    carregarNoticias()
  }, [])

  const noticiasFiltradas = useMemo(() => {
    if (active === 'todos' || active === 'mercados') {
      return articles
    }

    return articles.filter(article =>
      normalizar(article.category?.slug || '') === normalizar(active)
    )
  }, [articles, active])

  const destaque = noticiasFiltradas[0]
  const demais = noticiasFiltradas.slice(1, 7)

  const navegar = (categoria) => {
    setActive(categoria)
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <div style={styles.app}>

      <header style={styles.header}>
        <div
          style={styles.logoArea}
          onClick={() => navegar('todos')}
        >
          <div style={styles.logo}>P</div>

          <div>
            <div style={styles.logoNome}>Pulso Global</div>
            <div style={styles.logoSub}>
              Informação que move decisões.
            </div>
          </div>
        </div>

        <button
          style={styles.pulsoButton}
          onClick={() => navegar('mercados')}
        >
          ● PULSO AGORA
        </button>
      </header>

      <nav style={styles.menu}>
        {menu.map(([id, icon, nome]) => (
          <button
            key={id}
            onClick={() => navegar(id)}
            style={{
              ...styles.menuButton,
              ...(active === id ? styles.menuAtivo : {})
            }}
          >
            <span>{icon}</span>
            {nome}
          </button>
        ))}
      </nav>

      <main>

        <section style={styles.hero}>

          <div style={styles.heroTexto}>
            <div style={styles.eyebrow}>
              PULSO GLOBAL • AGORA
            </div>

            <h1 style={styles.titulo}>
              O que está acontecendo no mundo —
              <br />
              e por que isso importa?
            </h1>

            <p style={styles.descricao}>
              Notícias relevantes do Brasil e do mundo,
              com foco nos acontecimentos que podem
              impactar mercados, investimentos e
              criptoativos.
            </p>

            <div style={styles.acoes}>
              <button
                style={styles.botaoPrincipal}
                onClick={() =>
                  document
                    .getElementById('mercados')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Ver mercados →
              </button>

              <button
                style={styles.botaoSecundario}
                onClick={() => navegar('cripto')}
              >
                ₿ Radar Cripto
              </button>
            </div>
          </div>

          <div style={styles.destaque}>

            <div style={styles.tag}>
              {destaque?.category?.name || 'DESTAQUE'}
            </div>

            <h2 style={styles.destaqueTitulo}>
              {destaque
                ? destaque.title
                : 'As principais notícias aparecerão aqui.'}
            </h2>

            <p style={styles.destaqueTexto}>
              {destaque?.summary ||
                'O Pulso Global está preparado para organizar automaticamente as notícias mais relevantes.'}
            </p>

            {destaque && (
              <>
                <small style={styles.meta}>
                  {destaque.source?.name || 'Pulso Global'}
                  {' • '}
                  {dataFormatada(
                    destaque.published_at ||
                    destaque.created_at
                  )}
                </small>

                {destaque.url && (
                  <a
                    href={destaque.url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    Ler notícia original ↗
                  </a>
                )}
              </>
            )}

          </div>
        </section>

        <section id="mercados" style={styles.section}>

          <div style={styles.sectionTopo}>
            <div>
              <div style={styles.eyebrow}>
                VISÃO RÁPIDA
              </div>

              <h2 style={styles.sectionTitulo}>
                Pulso dos mercados
              </h2>
            </div>

            <span style={styles.atualizacao}>
              ● EM ATUALIZAÇÃO
            </span>
          </div>

          <div style={styles.mercadosGrid}>

            {mercados.map(([icone, nome, simbolo]) => (
              <button
                key={simbolo}
                style={styles.mercado}
                onClick={() =>
                  navegar(
                    simbolo === 'BTC' ||
                    simbolo === 'ETH'
                      ? 'cripto'
                      : 'mercados'
                  )
                }
              >
                <div style={styles.iconeMercado}>
                  {icone}
                </div>

                <div style={{ flex: 1 }}>
                  <strong style={styles.nomeMercado}>
                    {nome}
                  </strong>

                  <small style={styles.simbolo}>
                    {simbolo}
                  </small>
                </div>

                <strong style={styles.valor}>
                  {cotacoes[simbolo]?.price != null
  ? (simbolo === 'USD/BRL' ? 'R$ ' : simbolo === 'IBOV' ? '' : 'US$ ') +
    Number(cotacoes[simbolo].price).toLocaleString('pt-BR', {
      minimumFractionDigits: simbolo === 'IBOV' ? 0 : 2,
      maximumFractionDigits: simbolo === 'IBOV' ? 0 : 2
    })
  : '—'}
                </strong>

                <small style={styles.semDados}>
                {cotacoes[simbolo]?.changePct != null
  ? `${cotacoes[simbolo].changePct >= 0 ? '+' : ''}${Number(cotacoes[simbolo].changePct).toFixed(2)}%`
  : 'aguardando dados'}
                </small>
              </button>
            ))}

          </div>
        </section>

        <section style={styles.section}>

          <div style={styles.sectionTopo}>
            <div>
              <div style={styles.eyebrow}>
                O QUE MERECE ATENÇÃO
              </div>

              <h2 style={styles.sectionTitulo}>
                Notícias que importam
              </h2>
            </div>
          </div>

          {loading ? (
            <div style={styles.vazio}>
              Carregando o Pulso Global...
            </div>
          ) : !destaque ? (
            <div style={styles.vazio}>
              Ainda não há notícias cadastradas.
              <br />
              A alimentação automática está preparada.
            </div>
          ) : (
            <div style={styles.noticiasGrid}>
              {demais.map(article => (
                <Article
                  key={article.id}
                  article={article}
                />
              ))}
            </div>
          )}

        </section>

        <section style={styles.duasColunas}>

          <Categoria
            titulo="₿ Radar Cripto"
            subtitulo="Ativos digitais e notícias que movimentam o mercado"
            categoria="cripto"
            articles={articles}
            navegar={navegar}
          />

          <Categoria
            titulo="🇧🇷 Brasil"
            subtitulo="Economia e fatos com impacto local"
            categoria="brasil"
            articles={articles}
            navegar={navegar}
          />

        </section>

        <section style={styles.section}>

          <Categoria
            titulo="🌎 Mundo"
            subtitulo="Geopolítica, economia e decisões que atravessam fronteiras"
            categoria="mundo"
            articles={articles}
            navegar={navegar}
            grande
          />

        </section>
        <section
          style={{
            maxWidth: '1250px',
            margin: '40px auto',
            padding: '32px',
            borderRadius: '20px',
            background: '#111827',
            border: '1px solid #263244'
          }}
        >
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1.5px', color: '#52bcff' }}>
              PULSO GLOBAL • GRATUITO
            </div>

            <h2 style={{ fontSize: '28px', margin: '10px 0' }}>
              Receba o Pulso do Mercado
            </h2>

            <p style={{ color: '#93a7bb', lineHeight: '1.6' }}>
              Notícias que realmente importam, mercados, cripto e economia direto no seu celular.
            </p>

            <form onSubmit={inscreverNewsletter} style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
              <input
                value={newsletterNome}
                onChange={(e) => setNewsletterNome(e.target.value)}
                placeholder="Seu nome"
                style={{ padding: '14px', borderRadius: '10px', border: '1px solid #344054', background: '#0b1220', color: '#fff' }}
              />

              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                required
                style={{ padding: '14px', borderRadius: '10px', border: '1px solid #344054', background: '#0b1220', color: '#fff' }}
              />

              <button
                type="submit"
                disabled={newsletterLoading}
                style={{ padding: '14px', borderRadius: '10px', border: '0', cursor: 'pointer', fontWeight: '800' }}
              >
                {newsletterLoading ? 'Enviando...' : 'Quero receber o Pulso'}
              </button>

              {newsletterStatus && (
                <small style={{ color: '#93a7bb', marginTop: '5px' }}>
                  {newsletterStatus}
                </small>
              )}
            </form>
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <strong>Pulso Global</strong>
        <span>
          Notícias • Mercados • Cripto • Mundo
        </span>
      </footer>

    </div>
  )
}

function Article({ article }) {
  return (
    <article style={styles.card}>

      <div style={styles.tag}>
        {article.category?.name || 'Notícia'}
      </div>

      <h3 style={styles.cardTitulo}>
        {article.title}
      </h3>

      {article.summary && (
        <p style={styles.cardTexto}>
          {article.summary}
        </p>
      )}

      <small style={styles.meta}>
        {article.source?.name || 'Fonte'}
        {' • '}
        {dataFormatada(
          article.published_at ||
          article.created_at
        )}
      </small>

      {article.url && (
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          style={styles.link}
        >
          Ler mais ↗
        </a>
      )}

    </article>
  )
}

function Categoria({
  titulo,
  subtitulo,
  categoria,
  articles,
  navegar,
  grande
}) {
  const noticias = articles
    .filter(
      article =>
        normalizar(article.category?.slug || '') ===
        normalizar(categoria)
    )
    .slice(0, 4)

  return (
    <div
      style={{
        ...styles.categoria,
        ...(grande ? styles.categoriaGrande : {})
      }}
    >

      <div style={styles.categoriaTopo}>

        <div>
          <h2 style={styles.categoriaTitulo}>
            {titulo}
          </h2>

          <p style={styles.categoriaSubtitulo}>
            {subtitulo}
          </p>
        </div>

        <button
          style={styles.verTodas}
          onClick={() => navegar(categoria)}
        >
          Ver todas →
        </button>

      </div>

      {noticias.length ? (
        <div style={styles.noticiasGrid}>
          {noticias.map(article => (
            <Article
              key={article.id}
              article={article}
            />
          ))}
        </div>
      ) : (
        <div style={styles.vazio}>
          Nenhuma notícia desta categoria no momento.
        </div>
      )}

    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at 80% 0%, #132b49 0%, #06101d 42%)',
    color: '#eef4fb',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '0 20px'
  },

  header: {
    maxWidth: '1250px',
    margin: 'auto',
    height: '82px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #1d3147'
  },

  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer'
  },

  logo: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background:
      'linear-gradient(135deg,#38bdf8,#2563eb)',
    display: 'grid',
    placeItems: 'center',
    fontWeight: '900',
    fontSize: '22px'
  },

  logoNome: {
    fontSize: '20px',
    fontWeight: '800'
  },

  logoSub: {
    color: '#8ea3b8',
    fontSize: '11px'
  },

  pulsoButton: {
    border: 0,
    borderRadius: '10px',
    padding: '11px 15px',
    background: '#168be0',
    color: 'white',
    fontWeight: '800',
    cursor: 'pointer'
  },

  menu: {
    maxWidth: '1250px',
    margin: 'auto',
    display: 'flex',
    gap: '7px',
    overflowX: 'auto',
    padding: '14px 0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: 'rgba(6,16,29,.94)'
  },

  menuButton: {
    whiteSpace: 'nowrap',
    border: '1px solid #1c3147',
    background: '#0a1828',
    color: '#a9b9ca',
    borderRadius: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: '700'
  },

  menuAtivo: {
    background: '#15304b',
    color: 'white',
    borderColor: '#2c72a9'
  },

  hero: {
    maxWidth: '1250px',
    margin: 'auto',
    display: 'grid',
    gridTemplateColumns: '1.1fr .9fr',
    gap: '20px',
    padding: '45px 0 30px'
  },

  heroTexto: {
    padding: '20px 0'
  },

  eyebrow: {
    color: '#45b7ff',
    fontSize: '11px',
    fontWeight: '900',
    letterSpacing: '.14em'
  },

  titulo: {
    fontSize: 'clamp(34px,5vw,60px)',
    lineHeight: '1.04',
    letterSpacing: '-.045em',
    margin: '14px 0'
  },

  descricao: {
    color: '#a9b9ca',
    fontSize: '17px',
    lineHeight: '1.6',
    maxWidth: '680px'
  },

  acoes: {
    display: 'flex',
    gap: '10px',
    marginTop: '24px'
  },

  botaoPrincipal: {
    border: 0,
    borderRadius: '10px',
    padding: '12px 16px',
    background: '#168be0',
    color: 'white',
    fontWeight: '800',
    cursor: 'pointer'
  },

  botaoSecundario: {
    border: '1px solid #29445d',
    borderRadius: '10px',
    padding: '12px 16px',
    background: '#0d1d2e',
    color: 'white',
    fontWeight: '800',
    cursor: 'pointer'
  },

  destaque: {
    minHeight: '330px',
    padding: '28px',
    border: '1px solid #24425e',
    borderRadius: '20px',
    background:
      'linear-gradient(145deg,#0d2137,#091524)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    boxShadow: '0 20px 60px rgba(0,0,0,.3)'
  },

  tag: {
    width: 'max-content',
    borderRadius: '99px',
    padding: '5px 9px',
    background: '#123553',
    color: '#68c7ff',
    fontSize: '10px',
    fontWeight: '900',
    textTransform: 'uppercase'
  },

  destaqueTitulo: {
    fontSize: '28px',
    lineHeight: '1.15',
    margin: '14px 0 8px'
  },

  destaqueTexto: {
    color: '#93a7bb',
    lineHeight: '1.55'
  },

  meta: {
    color: '#71869a',
    fontSize: '11px',
    marginTop: '10px'
  },

  link: {
    color: '#52bcff',
    textDecoration: 'none',
    fontWeight: '800',
    fontSize: '12px',
    marginTop: '10px'
  },

  section: {
    maxWidth: '1250px',
    margin: 'auto',
    padding: '28px 0'
  },

  sectionTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
    marginBottom: '16px'
  },

  sectionTitulo: {
    margin: '5px 0',
    fontSize: '28px'
  },

  atualizacao: {
    color: '#6fd19b',
    fontSize: '10px',
    fontWeight: '800'
  },

  mercadosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5,1fr)',
    gap: '10px'
  },

  mercado: {
    minHeight: '125px',
    textAlign: 'left',
    padding: '16px',
    border: '1px solid #20384e',
    background: '#091827',
    borderRadius: '15px',
    color: 'white',
    cursor: 'pointer',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    gap: '9px',
    alignItems: 'center'
  },

  iconeMercado: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: '#112b42',
    display: 'grid',
    placeItems: 'center',
    fontWeight: '900'
  },

  nomeMercado: {
    display: 'block'
  },

  simbolo: {
    color: '#6f859b'
  },

  valor: {
    fontSize: '20px'
  },

  semDados: {
    gridColumn: '2/4',
    color: '#71869a'
  },

  noticiasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4,1fr)',
    gap: '12px'
  },

  card: {
    background: '#0a1929',
    border: '1px solid #1b3045',
    borderRadius: '15px',
    padding: '17px',
    minHeight: '190px'
  },

  cardTitulo: {
    fontSize: '17px',
    lineHeight: '1.25',
    margin: '12px 0 8px'
  },

  cardTexto: {
    color: '#93a7bb',
    fontSize: '13px',
    lineHeight: '1.5'
  },

  duasColunas: {
    maxWidth: '1250px',
    margin: 'auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px'
  },

  categoria: {
    padding: '28px 0'
  },

  categoriaGrande: {
    width: '100%'
  },

  categoriaTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '16px'
  },

  categoriaTitulo: {
    margin: '0 0 4px',
    fontSize: '27px'
  },

  categoriaSubtitulo: {
    margin: 0,
    color: '#93a7bb',
    fontSize: '13px'
  },

  verTodas: {
    border: 0,
    background: 'none',
    color: '#52bcff',
    fontWeight: '800',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },

  vazio: {
    border: '1px dashed #284158',
    borderRadius: '15px',
    padding: '28px',
    color: '#8095aa',
    textAlign: 'center',
    background: '#091827'
  },

  footer: {
    maxWidth: '1250px',
    margin: '30px auto 0',
    padding: '28px 0 45px',
    borderTop: '1px solid #1b3045',
    display: 'flex',
    justifyContent: 'space-between',
    color: '#71869a',
    fontSize: '12px'
  }
}
