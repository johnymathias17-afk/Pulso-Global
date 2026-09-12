import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')

const oldBlock = "const resumoLimpo = (summary = '', titulo = '') => { const s = limparTexto(summary); if (!s || normalizar(s) === normalizar(limparTexto(titulo))) return ''; return s.replace(/\\s*[|–—-]\\s*(brasil\\s*247|dw\\.com|reuters|bbc|cnn)\\s*$/i, '').trim() }"
const newBlock = "const resumoLimpo = (summary = '', titulo = '') => { const s = limparTexto(summary); const t = limparTexto(titulo); if (!s) return ''; const ns = normalizar(s); const nt = normalizar(t); if (!nt || ns === nt || ns.startsWith(nt + ' ')) return ''; const semFonte = s.replace(/\\s*[|–—-]\\s*(brasil\\s*247|dw\\.com|reuters|bbc|cnn)\\s*$/i, '').trim(); if (!semFonte || normalizar(semFonte) === nt || normalizar(semFonte).startsWith(nt + ' ')) return ''; return semFonte }"

if (s.includes(oldBlock)) {
  s = s.replace(oldBlock, newBlock)
  fs.writeFileSync(path, s)
  console.log('Summary build patch applied')
} else if (s.includes(newBlock)) {
  console.log('Summary build patch already applied')
} else {
  throw new Error('summary block not found')
}
