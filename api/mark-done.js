// api/mark-done.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers['x-painel-key'] !== process.env.PAINEL_SENHA) return res.status(401).end();

  const { cliente_id } = req.body;
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  await supabase.from('clientes').update({ status: 'entregue' }).eq('id', cliente_id);
  return res.status(200).json({ ok: true });
}
