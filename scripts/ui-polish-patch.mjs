import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')

const marker = 'const css = `'
const start = s.indexOf(marker)
if (start < 0) throw new Error('CSS block not found')
const end = s.indexOf('`', start + marker.length)
if (end < 0) throw new Error('CSS end not found')

const css = `
/* Final AGORA hierarchy: compact status rail, no oversized headline, no artificial whitespace. */
.vg-agora{margin-top:8px!important;padding:8px 0!important;min-height:0!important;height:auto!important;display:flex!important;align-items:center!important;gap:0!important}
.vg-agora-polish{display:inline-flex!important;align-items:baseline!important;gap:7px!important;line-height:1!important;white-space:nowrap!important}
.vg-agora-polish .agora-dot{font-size:10px!important;line-height:1!important;color:#d92d20!important}
.vg-agora-polish .agora-label{font-size:16px!important;font-weight:800!important;letter-spacing:.1px!important;color:#d92d20!important}
.vg-agora-polish .agora-copy{font-size:20px!important;font-weight:750!important;letter-spacing:-.25px!important;color:#101828!important}
.vg-agora small{display:none!important}
.vg-hero{margin-top:10px!important}
@media(max-width:760px){
  .vg-agora{margin-top:7px!important;padding:7px 0!important}
  .vg-agora-polish{gap:6px!important}
  .vg-agora-polish .agora-dot{font-size:9px!important}
  .vg-agora-polish .agora-label{font-size:16px!important}
  .vg-agora-polish .agora-copy{font-size:19px!important}
  .vg-hero{margin-top:7px!important}
  .vg-hero-copy{padding-top:14px!important}
}
@media(max-width:480px){
  .vg-agora-polish .agora-label{font-size:15px!important}
  .vg-agora-polish .agora-copy{font-size:18px!important}
  .vg-hero-copy{padding-top:12px!important}
}
`

s = s.slice(0, end) + css.slice(1) + s.slice(end)
fs.writeFileSync(path, s)
console.log('AGORA hierarchy refined')
