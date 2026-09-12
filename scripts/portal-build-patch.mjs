import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')

// Reorder the portal flow: hero -> latest news -> markets -> sections -> newsletter.
const orderMatch = s.match(/      (<section id="mercados"[\s\S]*?<\/section>)\n      (<section id="pulso-agora"[\s\S]*?<\/section>)/)
if (orderMatch && !s.includes('vg-flow-order')) {
  s = s.replace(orderMatch[0], `${orderMatch[2]}\n      ${orderMatch[1]}`)
}

// Add a compact "Últimas notícias" rail immediately below the hero.
const heroEnd = '</section>\n      <section id="pulso-agora"'
const breaking = `</section>\n      <section className="vg-breaking" aria-label="Últimas notícias"><div className="vg-breaking-label">● AGORA</div><div className="vg-breaking-list">{noticiasFiltradas.slice(0, 4).map((item, index) => <button key={item.id || index} onClick={() => item.id && (window.location.href = \`/noticia/\${encodeURIComponent(item.id)}\`)}>{noticiaApresentavel(item).displayTitle}</button>)}</div></section>\n      <section id="pulso-agora"`
if (!s.includes('className="vg-breaking"')) {
  if (!s.includes(heroEnd)) throw new Error('hero insertion point not found')
  s = s.replace(heroEnd, breaking)
}

// Add a marketing teaser for the future Vetor Pro product after the main news block.
const newsToSections = '</section>\n      <section style={styles.duasColunas}'
const pro = `</section>\n      <section className="vg-pro" aria-label="Vetor Pro"><div><div className="vg-pro-kicker">VETOR PRO • EM DESENVOLVIMENTO</div><h2>Mais contexto. Menos ruído.</h2><p>Uma experiência premium para acompanhar mercados, análises, sinais e conteúdos exclusivos do Vetor Global.</p></div><button onClick={() => document.querySelector('.vg-newsletter')?.scrollIntoView({ behavior: 'smooth' })}>Quero saber quando lançar →</button></section>\n      <section style={styles.duasColunas}`
if (!s.includes('className="vg-pro"')) {
  if (!s.includes(newsToSections)) throw new Error('news insertion point not found')
  s = s.replace(newsToSections, pro)
}

// Stronger marketing language in the newsletter without changing the signup flow.
s = s.replace('As notícias que realmente importam, mercados, cripto e economia direto no seu e-mail.', 'Um resumo direto ao ponto com notícias, mercados, cripto e economia — sem excesso de informação.')
s = s.replace('Você poderá deixar de receber os e-mails quando quiser.', '1 e-mail por dia. Conteúdo útil. Sem spam. Você pode sair quando quiser.')

// Add stable classes and visual hierarchy.
s = s.replace('<main>', '<main className="vg-main vg-flow-order">')
s = s.replace('<section id="pulso-agora" style={styles.section}>', '<section id="pulso-agora" className="vg-latest" style={styles.section}>')
s = s.replace('<section id="mercados" style={styles.section}>', '<section id="mercados" className="vg-market-section" style={styles.section}>')

const portalStyle = `<style>{\`\n.vg-main { display:flex; flex-direction:column; }\n.vg-breaking { max-width:1250px; width:100%; margin:18px auto 0; display:flex; align-items:center; gap:14px; border-top:1px solid #e4e7ec; border-bottom:1px solid #e4e7ec; padding:11px 0; }\n.vg-breaking-label { flex:0 0 auto; color:#155eef; font-size:11px; font-weight:900; letter-spacing:1px; }\n.vg-breaking-list { display:flex; gap:8px; overflow:hidden; flex:1; }\n.vg-breaking-list button { border:0; background:transparent; color:#344054; font-size:13px; font-weight:650; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; padding:0 8px; border-left:1px solid #e4e7ec; }\n.vg-latest { order:3; }\n.vg-market-section { order:4; }\n.vg-pro { max-width:1250px; width:100%; margin:40px auto 0; padding:28px; border-radius:18px; background:linear-gradient(135deg,#0b1220,#17233d); color:#fff; display:flex; align-items:center; justify-content:space-between; gap:28px; box-sizing:border-box; }\n.vg-pro-kicker { color:#8fb5ff; font-size:11px; font-weight:900; letter-spacing:1.2px; }\n.vg-pro h2 { margin:8px 0 7px; font-family:Newsreader,Georgia,serif; font-size:32px; }\n.vg-pro p { margin:0; max-width:700px; color:#d0d5dd; line-height:1.55; }\n.vg-pro button { flex:0 0 auto; border:1px solid #4f7cff; background:#155eef; color:#fff; border-radius:9px; padding:12px 16px; font-weight:800; cursor:pointer; }\n.vg-newsletter { scroll-margin-top:20px; }\n@media (max-width:760px) {\n  .vg-breaking { margin-top:10px; padding:10px 0; align-items:flex-start; }\n  .vg-breaking-list { overflow-x:auto; }\n  .vg-breaking-list button { min-width:220px; white-space:normal; line-height:1.35; }\n  .vg-pro { margin-top:28px; padding:22px; flex-direction:column; align-items:flex-start; }\n  .vg-pro h2 { font-size:28px; }\n  .vg-pro button { width:100%; }\n}\n\`}</style>`
if (!s.includes('vg-flow-order')) throw new Error('main hook not applied')
if (!s.includes('Vetor Pro • EM DESENVOLVIMENTO')) throw new Error('pro block not applied')
if (!s.includes('vg-portal-style-marker')) {
  s = s.replace('<main className="vg-main vg-flow-order">', `${portalStyle}<main className="vg-main vg-flow-order">`)
}

fs.writeFileSync(path, s)
console.log('Portal layout, marketing and editorial content patch applied')
