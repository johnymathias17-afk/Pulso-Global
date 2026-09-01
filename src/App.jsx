import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [categories, setCategories] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: news }] = await Promise.all([
        supabase.from('categories').select('id,name,slug').order('name'),
        supabase
          .from('articles')
          .select('id,title,summary,url,image_url,published_at,category:categories(name),source:sources(name)')
          .order('published_at', { ascending: false })
          .limit(20)
      ])
      setCategories(cats ?? [])
      setArticles(news ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <main className="app">
      <header className="hero">
        <div>
          <span className="eyebrow">INFORMAÇÃO EM UM SÓ LUGAR</span>
          <h1>Pulso Global</h1>
          <p>Brasil, mundo, tecnologia, economia, cripto, saúde e ciência.</p>
        </div>
      </header>

      <section className="categories">
        {categories.map(c => <span key={c.id} className="chip">{c.name}</span>)}
      </section>

      <section className="content">
        <div className="section-title">
          <h2>Últimas notícias</h2>
          <span>{articles.length} publicadas</span>
        </div>

        {loading ? (
          <div className="empty">Carregando...</div>
        ) : articles.length === 0 ? (
          <div className="empty">
            <strong>O Pulso Global está pronto.</strong>
            <p>Agora basta cadastrar as fontes e começar a alimentar as notícias.</p>
          </div>
        ) : (
          <div className="grid">
            {articles.map(article => (
              <article className="card" key={article.id}>
                {article.image_url && <img src={article.image_url} alt="" />}
                <div className="card-body">
                  <small>{article.category?.name ?? 'Geral'} · {article.source?.name ?? 'Fonte'}</small>
                  <h3>{article.title}</h3>
                  {article.summary && <p>{article.summary}</p>}
                  <a href={article.url} target="_blank" rel="noreferrer">Ler notícia →</a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
