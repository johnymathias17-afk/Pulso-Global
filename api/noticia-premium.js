function esc(v = '') {
  return String(v).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

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
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Notícia';
    const shareUrl = `${base}/noticia/${encodeURIComponent(id)}`;
    const shareText = encodeURIComponent(`${title}\n${shareUrl}`);

    const style = `<style>
      .vg-premium-bar{display:flex;gap:10px;align-items:center;justify-content:space-between;margin:0 0 22px;padding:12px 14px;border:1px solid #dbe3ef;border-radius:14px;background:#f7f9fc}
      .vg-premium-label{font-size:11px;font-weight:800;letter-spacing:.12em;color:#155eef;text-transform:uppercase}
      .vg-actions{display:flex;gap:8px;flex-wrap:wrap}
      .vg-actions a,.vg-actions button{appearance:none;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#0b1220;text-decoration:none;padding:8px 11px;font:700 12px Arial,sans-serif;cursor:pointer}
      .vg-actions a.primary,.vg-actions button.primary{background:#155eef;color:#fff;border-color:#155eef}
      .vg-context{margin:28px 0;padding:22px;border-radius:16px;background:linear-gradient(135deg,#0b1220,#14213d);color:#fff}
      .vg-context strong{display:block;margin-bottom:7px;font-size:12px;letter-spacing:.1em;color:#d4a72c;text-transform:uppercase}
      .vg-context p{margin:0;font-size:16px;line-height:1.6;color:#e8edf5}
      @media(max-width:600px){.vg-premium-bar{align-items:flex-start;flex-direction:column}.vg-actions{width:100%}.vg-actions a,.vg-actions button{flex:1;text-align:center}.vg-context{padding:19px}.vg-context p{font-size:17px}}
    </style>`;

    const bar = `<div class="vg-premium-bar"><div><div class="vg-premium-label">Leitura Vetor</div><div style="font:700 13px Arial,sans-serif;color:#334155;margin-top:3px">Entenda o fato, o impacto e o que observar.</div></div><div class="vg-actions"><button class="primary" onclick="navigator.share?navigator.share({title:document.title,url:location.href}):navigator.clipboard.writeText(location.href).then(()=>alert('Link copiado.'))">Compartilhar</button><a href="https://wa.me/?text=${shareText}" target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div>`;
    const context = `<div class="vg-context"><strong>O diferencial do Vetor Global</strong><p>Não basta informar o que aconteceu. Nossa leitura editorial ajuda você a entender <b>por que isso importa</b> e quais são os próximos pontos que merecem atenção.</p></div>`;

    const out = html
      .replace('</head>', `${style}</head>`)
      .replace('<main class="wrap">', `<main class="wrap">${bar}`)
      .replace('</main>', `${context}</main>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');
    return res.status(200).send(out);
  } catch (error) {
    console.error('noticia-premium:', error);
    return res.status(502).send('Não foi possível carregar a matéria agora. Volte ao Vetor Global e tente novamente.');
  }
}
