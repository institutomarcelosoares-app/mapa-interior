# Mapa Interior — Deploy

## Estrutura do projeto

```
mapa-interior/
├── index.html           ← página do cliente
├── painel.html          ← painel do Marcelo
├── vercel.json          ← configuração de rotas
├── supabase-setup.sql   ← rode no Supabase primeiro
└── api/
    ├── webhook.js       ← Hotmart/Kiwify → gera token + envia email
    ├── validate.js      ← valida token do cliente
    ├── generate.js      ← chama a IA Anthropic
    ├── save-report.js   ← salva no Supabase + email para Marcelo
    ├── painel.js        ← dados para o painel
    └── mark-done.js     ← marca devolutiva como entregue
```

---

## Passo 1 — Supabase

1. Acesse seu Supabase → SQL Editor
2. Cole e execute o conteúdo de `supabase-setup.sql`
3. Anote: **Project URL** e **service_role key** (em Settings > API)

---

## Passo 2 — Resend (emails)

1. Crie conta em resend.com
2. Verifique seu domínio (ou use o domínio deles para testes)
3. Anote a **API Key**

---

## Passo 3 — GitHub

1. Crie repositório novo: `mapa-interior`
2. Suba todos esses arquivos

---

## Passo 4 — Vercel

1. Conecte o repositório ao Vercel
2. Em **Settings > Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | URL do seu projeto Supabase |
| `SUPABASE_SERVICE_KEY` | service_role key do Supabase |
| `ANTHROPIC_API_KEY` | sua chave da Anthropic |
| `RESEND_API_KEY` | sua chave do Resend |
| `EMAIL_MARCELO` | seu email pessoal |
| `APP_URL` | https://seudominio.com.br |
| `PAINEL_URL` | https://seudominio.com.br/painel |
| `PAINEL_SENHA` | senha que você definir para o painel |

3. Redeploy

---

## Passo 5 — Hotmart ou Kiwify

Configure o webhook de pós-pagamento apontando para:
```
https://seudominio.com.br/api/webhook
```

---

## Passo 6 — Alterar senha do painel

No arquivo `painel.html`, linha:
```js
const SENHA = 'marcelo2025';
```
Troque pela mesma senha que colocou em `PAINEL_SENHA` no Vercel.

---

## Acesso

- **Cliente:** `https://seudominio.com.br?token=XXXXX`
- **Painel:** `https://seudominio.com.br/painel`
