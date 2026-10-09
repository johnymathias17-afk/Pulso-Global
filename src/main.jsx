import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './premium.css'
import './editorial.css'
import './pro-teaser.css'
import './newsroom-visual.css'
import './editorial-priority.css'
import './editorial-engine.css'
import './brand-logo.css'
import './vetor-approved-layout.css'
import './contrast-fix.css'

class StartupBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Falha ao renderizar o Vetor Global:', error)
  }

  render() {
    if (this.state.failed) {
      return (
        <main style={{ maxWidth: 680, margin: '48px auto', padding: '24px', fontFamily: 'Arial, sans-serif', color: '#0b1220', lineHeight: 1.6 }}>
          <h1 style={{ fontSize: 28 }}>Vetor Global</h1>
          <p>Estamos com uma dificuldade para carregar esta página.</p>
          <p>Tente recarregar. Se o problema continuar, volte em alguns instantes.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '12px 18px', border: 0, borderRadius: 10, background: '#0b1220', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Recarregar página
          </button>
        </main>
      )
    }
    return this.props.children
  }
}

const rootElement = document.getElementById('root')
const root = createRoot(rootElement)

function showStartupError() {
  root.render(
    <main style={{ maxWidth: 680, margin: '48px auto', padding: '24px', fontFamily: 'Arial, sans-serif', color: '#0b1220', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 28 }}>Vetor Global</h1>
      <p>Não foi possível iniciar o portal neste momento.</p>
      <p>Verifique sua conexão e tente novamente.</p>
      <button onClick={() => window.location.reload()} style={{ padding: '12px 18px', border: 0, borderRadius: 10, background: '#0b1220', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
        Tentar novamente
      </button>
    </main>
  )
}

// Start the core page independently from optional enhancement scripts.
// A failure in SEO/editorial/analytics enhancements must not prevent the portal from opening.
import('./App')
  .then(({ default: App }) => {
    root.render(
      <StartupBoundary>
        <App />
      </StartupBoundary>
    )
    return Promise.allSettled([
      import('./pro-teaser.js'),
      import('./seo-enhancer.js'),
      import('./editorial-enhancer.js'),
      import('./editorial-priority.js'),
      import('./editorial-engine.js'),
      import('./analytics-enhancer.js'),
    ])
  })
  .catch(error => {
    console.error('Falha ao iniciar o Vetor Global:', error)
    showStartupError()
  })
