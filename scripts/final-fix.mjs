import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')

// Guarantee the approved half-blue/half-white mark is used in the source header.
s = s.replace(/<span className="vg-logo"[^>]*>V<\/span>/g, '<span className="vg-logo" aria-hidden="true"></span>')
s = s.replace(/<span className="vg-logo">V<\/span>/g, '<span className="vg-logo" aria-hidden="true"></span>')

// Keep Em Destaque and Radar de Impacto mutually exclusive.
if (!s.includes('const emDestaqueIds = new Set')) {
  s = s.replace(
    /const radarImpacto = selecionadas\.filter\(item => item\?\.id !== destaque\?\.id\)\.slice\(0, 3\)/,
    "const emDestaqueIds = new Set((typeof emDestaque !== 'undefined' ? emDestaque : []).map(item => item?.id))\n  const radarImpacto = selecionadas.filter(item => item?.id !== destaque?.id && !emDestaqueIds.has(item?.id)).slice(0, 3)"
  )
}

// Provide colorful, original category visuals whenever an article has no image.
const visualCss = `.vg-card,.vg-lead,.vg-impact{position:relative}.vg-card .vg-card-visual,.vg-lead .vg-card-visual{display:block;width:100%;height:150px;border-radius:16px;background:linear-gradient(135deg,#2563eb 0%,#0b1220 52%,#f59e0b 100%);margin-bottom:18px;overflow:hidden}.vg-card .vg-card-visual:after,.vg-lead .vg-card-visual:after{content:'VETOR GLOBAL';display:flex;align-items:flex-end;height:100%;padding:18px;color:#fff;font:800 14px Arial;letter-spacing:1.5px;box-sizing:border-box}.vg-card img,.vg-lead img{display:block;width:100%;max-height:260px;object-fit:cover;border-radius:16px;margin-bottom:18px}`
if (!s.includes('vg-card-visual')) s = s.replace('const css = `', 'const css = `' + visualCss)

fs.writeFileSync(path, s)
console.log('Final production fixes applied')
