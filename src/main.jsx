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

const root = createRoot(document.getElementById('root'))

function StartupMessage({ failed = false }) {
  return (
    <main style={{ maxWidth: 680, margin: '48px auto', padding: '24px', fontFamily: 'Arial, sans-serif', color: '#0b1220', lineHeight: 1.6, background: '#fff', minHeight: '160px' }}>
      <h1 style={{ fontSize: 28 }}>Vetor Global</h1>
      <p>{failed ? 'Não foi possível carregar o portal neste momento.' : 'Carregando o Vetor Global…'}</p>
      {failed && <><p>O conteúdo principal não iniciou. Tente novamente em instantes.</p><button onClick={() => window.location.reload()} style={{ padding: '12px 18px', border: 0, borderRadius: 10, background: '#0b1220', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Tentar novamente</button></>}
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
    return this.state.failed ? <StartupMessage failed /> : this.props.children
  }
}

root.render(<StartupMessage />)

let appStarted = false
const startupTimeout = setTimeout(() => {
  if (!appStarted) {
    console.error('Tempo limite excedido ao iniciar o Vetor Global.')
    root.render(<StartupMessage failed />)
  }
}, 12000)

import('./App')
  .then(({ default: App }) => {
    appStarted = true
    clearTimeout(startupTimeout)
    root.render(<StartupBoundary><App /></StartupBoundary>)
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
    appStarted = true
    clearTimeout(startupTimeout)
    console.error('Falha ao iniciar o Vetor Global:', error)
    root.render(<StartupMessage failed />)
  })
