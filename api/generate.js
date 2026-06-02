export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt ausente' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    console.log('Resposta Anthropic:', JSON.stringify(data).slice(0, 200));

    if (!data.content || !data.content[0]) {
      console.error('Estrutura inesperada:', JSON.stringify(data));
      return res.status(500).json({ error: 'Resposta inválida da IA', data });
    }

    const raw = data.content[0].text;
    const clean = raw.replace(/```json|```/g, '').trim();
    const report = JSON.parse(clean);

    return res.status(200).json({ report });
  } catch (err) {
    console.error('Erro na geração:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
