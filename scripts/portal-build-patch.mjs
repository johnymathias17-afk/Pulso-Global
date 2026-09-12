import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')

// Stable hooks used by the portal responsive layer.
s = s.replace('<main>', '<main className="vg-main">')
s = s.replace('<main className="vg-main">', '<main className="vg-main">')
s = s.replace('<section style={styles.hero}>', '<section className="vg-hero" style={styles.hero}>')
s = s.replace('<section id="pulso-agora" style={styles.section}>', '<section id="pulso-agora" className="vg-latest" style={styles.section}>')
s = s.replace('<section id="mercados" style={styles.section}>', '<section id="mercados" className="vg-market-section" style={styles.section}>')
s = s.replace('<section style={styles.newsletter}>', '<section className="vg-newsletter" style={styles.newsletter}>')

// Put the market block after the main news block in the source order.
const markets = s.match(/      (<section id="mercados"[\s\S]*?<\/section>)\n      (<section id="pulso-agora"[\s\S]*?<\/section>)/)
if (markets) s = s.replace(markets[0], `${markets[2]}\n      ${markets[1]}`)

// Compact AGORA rail directly below the hero.
if (!s.includes('className="vg-breaking"')) {
  const marker = '</section>\n      <section id="pulso-agora"'
  const rail = '</section>\n      <section className="vg-breaking" aria-label="Últimas notícias"><div className="vg-breaking-label">● AGORA</div><div className="vg-breaking-list">{noticiasFiltradas.slice(0, 4).map((item, index) => <button key={item.id || index} onClick={() => item.id && (window.location.href = `/noticia/${encodeURIComponent(item.id)}`)}>{noticiaApresentavel(item).displayTitle}</button>)}</div></section>\n      <section id="pulso-agora"'
  if (!s.includes(marker)) throw new Error('hero insertion point not found')
  s = s.replace(marker, rail)
}

// Vetor Pro teaser after the main news section.
if (!s.includes('className="vg-pro"')) {
  const marker = '</section>\n      <section style={styles.duasColunas}'
  const pro = '</section>\n      <section className="vg-pro" aria-label="Vetor Pro"><div><div className="vg-pro-kicker">VETOR PRO • EM DESENVOLVIMENTO</div><h2>Mais contexto. Menos ruído.</h2><p>Uma experiência premium para acompanhar mercados, análises, sinais e conteúdos exclusivos do Vetor Global.</p></div><button onClick={() => document.querySelector(".vg-newsletter")?.scrollIntoView({ behavior: "smooth" })}>Quero saber quando lançar →</button></section>\n      <section style={styles.duasColunas}'
  if (!s.includes(marker)) throw new Error('Vetor Pro insertion point not found')
  s = s.replace(marker, pro)
}

// Newsletter positioning copy.
s = s.replace('As notícias que realmente importam, mercados, cripto e economia direto no seu e-mail.', 'Um resumo direto ao ponto com notícias, mercados, cripto e economia — sem excesso de informação.')
s = s.replace('Você poderá deixar de receber os e-mails quando quiser.', '1 e-mail por dia. Conteúdo útil. Sem spam. Você pode sair quando quiser.')

const portalStyle = `<style>{\`
.vg-main{display:flex;flex-direction:column;width:100%;}
.vg-breaking{max-width:1250px;width:100%;margin:10px auto 0;display:flex;align-items:center;gap:14px;border-top:1px solid #e4e7ec;border-bottom:1px solid #e4e7ec;padding:11px 0;box-sizing:border-box;}
.vg-breaking-label{flex:0 0 auto;color:#155eef;font-size:11px;font-weight:900;letter-spacing:1px;}
.vg-breaking-list{display:flex;gap:8px;overflow:hidden;flex:1;}
.vg-breaking-list button{border:0;background:transparent;color:#344054;font-size:13px;font-weight:650;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;padding:0 8px;border-left:1px solid #e4e7ec;}
.vg-pro{max-width:1250px;width:100%;margin:32px auto 0;padding:28px;border-radius:18px;background:linear-gradient(135deg,#0b1220,#17233d);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:28px;box-sizing:border-box;}
.vg-pro-kicker{color:#8fb5ff;font-size:11px;font-weight:900;letter-spacing:1.2px;}
.vg-pro h2{margin:8px 0 7px;font-family:Newsreader,Georgia,serif;font-size:32px;}
.vg-pro p{margin:0;max-width:700px;color:#d0d5dd;line-height:1.55;}
.vg-pro button{flex:0 0 auto;border:1px solid #4f7cff;background:#155eef;color:#fff;border-radius:9px;padding:12px 16px;font-weight:800;cursor:pointer;}
@media(max-width:760px){.vg-breaking{margin-top:8px;padding:10px 0;align-items:flex-start}.vg-breaking-list{overflow-x:auto}.vg-breaking-list button{min-width:220px;white-space:normal;line-height:1.35}.vg-pro{margin-top:24px;padding:22px;flex-direction:column;align-items:flex-start}.vg-pro h2{font-size:28px}.vg-pro button{width:100%}}
\`}</style>`
if (!s.includes('vg-portal-style')) {
  s = s.replace('<main className="vg-main">', portalStyle.replace('<style>{`', '<style data-vg-portal-style>{`') )
}

fs.writeFileSync(path, s)
console.log('Portal build patch applied')
