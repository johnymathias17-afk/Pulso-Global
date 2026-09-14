export default async function handler(req, res) {
  const id = String(req.query?.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!id) return res.status(400).json({ ok: false, error: 'invalid_id' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ ok: false, error: 'supabase_not_configured' });

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/register_article_view`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ p_article_id: id })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('registrar-view rpc:', response.status, detail);
      return res.status(502).json({ ok: false, error: 'view_registration_failed' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('registrar-view:', error);
    return res.status(502).json({ ok: false, error: 'view_registration_unavailable' });
  }
}
