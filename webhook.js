// api/webhook.js
// Recebe confirmação de pagamento da Hotmart ou Kiwify
// Gera token único e envia email de acesso ao cliente

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  let nome, email;

  // Detecta se é Hotmart ou Kiwify pelo payload
  const body = req.body;

  if (body?.data?.buyer) {
    // HOTMART
    const status = body?.data?.purchase?.status;
    if (status !== 'APPROVED' && status !== 'COMPLETE') {
      return res.status(200).json({ ok: true, msg: 'Evento ignorado' });
    }
    nome  = body.data.buyer.name;
    email = body.data.buyer.email;

  } else if (body?.customer) {
    // KIWIFY
    const status = body?.status;
    if (status !== 'paid') {
      return res.status(200).json({ ok: true, msg: 'Evento ignorado' });
    }
    nome  = body.customer.name;
    email = body.customer.email;

  } else {
    return res.status(400).json({ error: 'Payload não reconhecido' });
  }

  // Gera token único
  const token = crypto.randomBytes(20).toString('hex');

  // Salva cliente no Supabase
  const { error } = await supabase.from('clientes').insert({ nome, email, token });
  if (error) {
    // Se já existe (compra duplicada), não recria
    if (error.code !== '23505') {
      console.error('Erro ao criar cliente:', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
    return res.status(200).json({ ok: true, msg: 'Cliente já existe' });
  }

  // Envia email de acesso ao cliente via Resend
  const link = `${process.env.APP_URL}?token=${token}`;
  const emailHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:Georgia,serif;max-width:520px;margin:40px auto;color:#1a110a;padding:0 20px">
  <div style="text-align:center;margin-bottom:32px">
    <svg width="64" height="64" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="54" fill="none" stroke="#c8bfb4" stroke-width="0.8"/>
      <circle cx="60" cy="60" r="43" fill="none" stroke="#d8d0c6" stroke-width="0.45" stroke-dasharray="2.5 7"/>
      <circle cx="60" cy="60" r="30" fill="none" stroke="#e2dbd2" stroke-width="0.4" stroke-dasharray="1.5 9"/>
      <circle cx="60" cy="60" r="17" fill="none" stroke="#ece6de" stroke-width="0.35" stroke-dasharray="1 11"/>
      <line x1="60" y1="7" x2="60" y2="113" stroke="#d8d0c6" stroke-width="0.35" opacity="0.55"/>
      <line x1="7" y1="60" x2="113" y2="60" stroke="#d8d0c6" stroke-width="0.35" opacity="0.55"/>
      <polygon points="60,8 63.5,60 56.5,60" fill="#1e1208"/>
      <polygon points="60,112 63.5,60 56.5,60" fill="#bdb0a4"/>
      <polygon points="8,60 60,56.5 60,63.5" fill="#a89888" opacity="0.45"/>
      <polygon points="112,60 60,56.5 60,63.5" fill="#a89888" opacity="0.45"/>
      <circle cx="60" cy="60" r="5.5" fill="#f9f7f4" stroke="#1e1208" stroke-width="0.9"/>
      <circle cx="60" cy="60" r="2" fill="#1e1208"/>
    </svg>
    <div style="font-size:18px;letter-spacing:.28em;text-transform:uppercase;margin-top:12px">MAPA INTERIOR</div>
    <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#a09080;margin-top:4px">por Marcelo Soares</div>
  </div>

  <p style="font-size:16px">Olá, ${nome.split(' ')[0]}.</p>

  <p style="line-height:1.7;color:#3a2a1e">
    Seu acesso ao Mapa Interior está pronto. Clique no botão abaixo para responder ao questionário — leva de 15 a 20 minutos e não há respostas certas ou erradas.
  </p>

  <p style="line-height:1.7;color:#3a2a1e">
    Após enviar suas respostas, Marcelo vai analisar seu perfil e você receberá sua devolutiva personalizada em vídeo <strong>em até 48 horas úteis</strong>.
  </p>

  <div style="text-align:center;margin:36px 0">
    <a href="${link}" style="background:#1e1208;color:#f9f7f4;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:14px;letter-spacing:.1em;text-transform:uppercase;display:inline-block">
      Acessar meu Mapa Interior
    </a>
  </div>

  <p style="font-size:12px;color:#a09080;line-height:1.6">
    Este link é exclusivo e pessoal — funciona uma única vez. Se tiver qualquer problema, responda este email.
  </p>

  <hr style="border:none;border-top:0.5px solid #e4ddd6;margin:32px 0">
  <p style="font-size:11px;color:#b0a898;text-align:center">Marcelo Soares · Instituto Marcelo Soares</p>
</body>
</html>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Marcelo Soares <noreply@mapainteriror.com.br>',
      to: email,
      subject: 'Seu acesso ao Mapa Interior está pronto',
      html: emailHtml
    })
  });

  return res.status(200).json({ ok: true });
}
