function esc(v = '') {
  return String(v).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function cleanText(v = '') { return String(v).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

export default async function handler(req, res) {
  const id = String(req.query?.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!id) return res.status(400).send('Identificador da notícia inválido.');

  const host = req.headers?.host || 'vetorglobal.com.br';
  const proto = req.headers?.['x-forwarded-proto'] || 'https';
  const base = `${proto}://${host}`;
  const target = `${base}/api/noticia?id=${encodeURIComponent(id)}`;

  try {
    const upstream = await fetch(target, { headers: { accept: 'text/html' } });
    const html = await upstream.text();
    if (!upstream.ok) return res.status(upstream.status).send(html);

    const titleMatch = html.match(/<h1 class="title">([\s\S]*?)<\/h1>/i);
    const title = titleMatch ? cleanText(titleMatch[1]) : 'Notícia';
    const shareUrl = `${base}/noticia/${encodeURIComponent(id)}`;
    const shareText = encodeURIComponent(`${title}\n${shareUrl}`);

    let related = '';
    try {
      const sitemap = await fetch(`${base}/sitemap.xml`, { headers: { accept: 'application/xml' } });
      const xml = await sitemap.text();
      const ids = [...xml.matchAll(/<loc>[^<]*\/noticia\/([^<]+)<\/loc>/g)].map(m => m[1]).filter(x => x !== id).slice(0, 6);
      const items = await Promise.all(ids.map(async rid => {
        try {
          const r = await fetch(`${base}/api/noticia?id=${encodeURIComponent(rid)}`, { headers: { accept: 'text/html' } });
          if (!r.ok) return null;
          const h = await r.text();
          const tm = h.match(/<h1 class="title">([\s\S]*?)<\/h1>/i);
          if (!tm) return null;
          const rt = cleanText(tm[1]);
          return `<a class="vg-related-item" href="/noticia/${encodeURIComponent(rid)}"><span>VETOR GLOBAL</span>${esc(rt)}<b>Entender o contexto →</b></a>`;
        } catch { return null; }
      }));
      const valid = items.filter(Boolean).slice(0, 3);
      if (valid.length) related = `<section class="vg-related"><div class="vg-section-label">Continue no Vetor</div><h2>Leia também</h2><div class="vg-related-grid">${valid.join('')}</div></section>`;
    } catch {}

    const style = `<style>
      .vg-premium-bar{display:flex;gap:10px;align-items:center;justify-content:space-between;margin:0 0 22px;padding:12px 14px;border:1px solid #dbe3ef;border-radius:14px;background:#f7f9fc}
      .vg-premium-label{font-size:11px;font-weight:800;letter-spacing:.12em;color:#155eef;text-transform:uppercase}
      .vg-actions{display:flex;gap:8px;flex-wrap:wrap}.vg-actions a,.vg-actions button{appearance:none;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#0b1220;text-decoration:none;padding:8px 11px;font:700 12px Arial,sans-serif;cursor:pointer}.vg-actions a.primary,.vg-actions button.primary{background:#155eef;color:#fff;border-color:#155eef}
      .vg-context{margin:28px 0;padding:22px;border-radius:16px;background:linear-gradient(135deg,#0b1220,#14213d);color:#fff}.vg-context strong{display:block;margin-bottom:7px;font-size:12px;letter-spacing:.1em;color:#d4a72c;text-transform:uppercase}.vg-context p{margin:0;font-size:16px;line-height:1.6;color:#e8edf5}
      .vg-related{margin-top:34px;padding-top:28px;border-top:1px solid #e4e7ec}.vg-related h2{font:800 28px Georgia,serif;margin:6px 0 16px;color:#101828}.vg-section-label{font:800 11px Arial,sans-serif;letter-spacing:.12em;color:#155eef;text-transform:uppercase}.vg-related-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.vg-related-item{display:flex;flex-direction:column;gap:8px;text-decoration:none;color:#101828;background:#fff;border:1px solid #e4e7ec;border-radius:14px;padding:15px;font:700 16px/1.3 Georgia,serif}.vg-related-item span{font:800 10px Arial,sans-serif;letter-spacing:.1em;color:#155eef}.vg-related-item b{font:800 11px Arial,sans-serif;color:#155eef;margin-top:auto}
      @media(max-width:600px){.vg-premium-bar{align-items:flex-start;flex-direction:column}.vg-actions{width:100%}.vg-actions a,.vg-actions button{flex:1;text-align:center}.vg-context{padding:19px}.vg-context p{font-size:17px}.vg-related-grid{grid-template-columns:1fr}.vg-related h2{font-size:25px}}
    </style>`;

    const bar = `<div class="vg-premium-bar"><div><div class="vg-premium-label">Leitura Vetor</div><div style="font:700 13px Arial,sans-serif;color:#334155;margin-top:3px">Entenda o fato, o impacto e o que observar.</div></div><div class="vg-actions"><button class="primary" onclick="navigator.share?navigator.share({title:document.title,url:location.href}):navigator.clipboard.writeText(location.href).then(()=>alert('Link copiado.'))">Compartilhar</button><a href="https://wa.me/?text=${shareText}" target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div>`;
    const context = `<div class="vg-context"><strong>O diferencial do Vetor Global</strong><p>Não basta informar o que aconteceu. Nossa leitura editorial ajuda você a entender <b>por que isso importa</b> e quais são os próximos pontos que merecem atenção.</p></div>`;

    const out = html.replace('</head>', `${style}</head>`).replace('<main class="wrap">', `<main class="wrap">${bar}`).replace('</main>', `${context}${related}</main>`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');
    return res.status(200).send(out);
  } catch (error) {
    console.error('noticia-premium:', error);
    return res.status(502).send('Não foi possível carregar a matéria agora. Volte ao Vetor Global e tente novamente.');
  }
}
