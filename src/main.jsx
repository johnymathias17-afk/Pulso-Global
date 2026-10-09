import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
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

const root = createRoot(document.getElementById('root'))

function StartupMessage() {
  return (
    <main style={{ maxWidth: 680, margin: '48px auto', padding: '24px', fontFamily: 'Arial, sans-serif', color: '#0b1220', lineHeight: 1.6, background: '#fff', minHeight: '160px' }}>
      <h1 style={{ fontSize: 28 }}>Vetor Global</h1>
      <p>Não foi possível carregar o portal neste momento.</p>
      <p>O conteúdo principal encontrou um erro. Tente novamente.</p>
      <button onClick={() => window.location.reload()} style={{ padding: '12px 18px', border: 0, borderRadius: 10, background: '#0b1220', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Tentar novamente</button>
    </main>
  )
}

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
    return this.state.failed ? <StartupMessage /> : this.props.children
  }
}

// Keep the main portal in the entry bundle so a separate App chunk cannot
// leave mobile browsers stuck on a blank page when that chunk fails to load.
root.render(<StartupBoundary><App /></StartupBoundary>)

// Nonessential enhancements must never block the main portal from rendering.
Promise.allSettled([
  import('./pro-teaser.js'),
  import('./seo-enhancer.js'),
  import('./editorial-enhancer.js'),
  import('./editorial-priority.js'),
  import('./editorial-engine.js'),
  import('./analytics-enhancer.js'),
]).then(results => {
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn('Recurso opcional do portal indisponível:', index, result.reason)
    }
  })
})
