// api/validate.js
// Verifica se o token existe e não foi usado ainda

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token ausente' });

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome, email, status')
    .eq('token', token)
    .single();

  if (error || !data) {
    return res.status(404).json({ valido: false, motivo: 'token_invalido' });
  }

  if (data.status === 'respondido' || data.status === 'entregue') {
    return res.status(200).json({ valido: false, motivo: 'ja_respondeu' });
  }

  return res.status(200).json({
    valido: true,
    nome: data.nome,
    email: data.email,
    cliente_id: data.id
  });
}
