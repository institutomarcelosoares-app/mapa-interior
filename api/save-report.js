// api/save-report.js
// Recebe relatório gerado pela IA, salva no Supabase e envia email para Marcelo

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { cliente_id, nome, email, token, relatorio, respostas } = req.body;
  if (!cliente_id || !relatorio) return res.status(400).json({ error: 'Dados incompletos' });

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // 1. Salva relatório no banco
  const { error: errRelatorio } = await supabase.from('relatorios').insert({
    cliente_id,
    nome,
    email,
    perfil_sintese:      relatorio.perfil_sintese,
    temperamento_tipo:   relatorio.temperamento?.tipo,
    temperamento_desc:   relatorio.temperamento?.descricao,
    disc_quadrante:      relatorio.disc?.quadrante,
    disc_desc:           relatorio.disc?.descricao,
    eneagrama_tipo:      relatorio.eneagrama?.tipo_provavel,
    eneagrama_tipo2:     relatorio.eneagrama?.tipo_secundario,
    eneagrama_desc:      relatorio.eneagrama?.descricao,
    padrao_mecanismo:    relatorio.padrao_inconsciente?.mecanismo,
    padrao_desc:         relatorio.padrao_inconsciente?.descricao,
    pontos_cegos:        relatorio.pontos_cegos,
    potencial_latente:   relatorio.potencial_latente,
    pauta_devolutiva:    relatorio.pauta_devolutiva,
    respostas:           respostas
  });

  if (errRelatorio) {
    console.error('Erro ao salvar relatório:', errRelatorio);
    return res.status(500).json({ error: 'Erro ao salvar' });
  }

  // 2. Marca cliente como respondido
  await supabase
    .from('clientes')
    .update({ status: 'respondido', respondido_em: new Date().toISOString() })
    .eq('id', cliente_id);

  // 3. Envia email para Marcelo via Resend
  try {
    const emailBody = `
<h2>Novo Mapa Interior recebido</h2>
<p><strong>Cliente:</strong> ${nome}<br>
<strong>Email:</strong> ${email}<br>
<strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>

<hr>
<h3>Perfil: ${relatorio.temperamento?.tipo} | DISC ${relatorio.disc?.quadrante} | ${relatorio.eneagrama?.tipo_provavel}</h3>

<h3>Síntese</h3>
<p>${relatorio.perfil_sintese}</p>

<h3>Temperamento — ${relatorio.temperamento?.tipo}</h3>
<p>${relatorio.temperamento?.descricao}</p>

<h3>DISC — ${relatorio.disc?.quadrante}</h3>
<p>${relatorio.disc?.descricao}</p>

<h3>Eneagrama — ${relatorio.eneagrama?.tipo_provavel}</h3>
<p>${relatorio.eneagrama?.descricao}</p>

<h3>Padrão inconsciente — ${relatorio.padrao_inconsciente?.mecanismo}</h3>
<p>${relatorio.padrao_inconsciente?.descricao}</p>

<h3>Pontos cegos</h3>
<p>${relatorio.pontos_cegos}</p>

<h3>Potencial latente</h3>
<p>${relatorio.potencial_latente}</p>

<h3>Pauta da devolutiva</h3>
<p style="white-space:pre-line">${relatorio.pauta_devolutiva}</p>

<hr>
<p><a href="${process.env.PAINEL_URL}">Acessar painel completo</a></p>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Mapa Interior <noreply@mapainteriror.com.br>',
        to: process.env.EMAIL_MARCELO,
        subject: `Novo Mapa Interior — ${nome}`,
        html: emailBody
      })
    });
  } catch (e) {
    console.error('Erro ao enviar email:', e);
    // Não falha o request — relatório já foi salvo no banco
  }

  return res.status(200).json({ ok: true });
}
