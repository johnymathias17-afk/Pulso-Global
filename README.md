# Pulso Global

Aplicação inicial do Pulso Global, preparada para Vite + React + Supabase e publicação em Cloudflare Pages.

## Desenvolvimento

1. Copie `.env.example` para `.env.local`.
2. Preencha `VITE_SUPABASE_PUBLISHABLE_KEY` com a chave **publishable** do projeto Supabase.
3. Execute `npm install`.
4. Execute `npm run dev`.

## Produção

Execute `npm run build`. A pasta `dist/` é a saída para hospedagem estática, incluindo Cloudflare Pages.

## Banco

O projeto Supabase já possui as tabelas `profiles`, `categories`, `sources`, `articles` e `saved_articles`, com RLS habilitado.
