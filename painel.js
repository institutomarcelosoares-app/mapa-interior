// api/painel.js
// Retorna todos os clientes + relatórios para o painel do Marcelo

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (req.headers['x-painel-key'] !== process.env.PAINEL_SENHA) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, email, status, criado_em, respondido_em')
    .order('criado_em', { ascending: false });

  const { data: relatorios } = await supabase
    .from('relatorios')
    .select('*');

  const merged = (clientes || []).map(c => ({
    ...c,
    relatorio: (relatorios || []).find(r => r.cliente_id === c.id) || null
  }));

  return res.status(200).json({ clientes: merged });
}
