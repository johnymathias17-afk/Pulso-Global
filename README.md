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


## Radar BTC ao vivo

Abra `/radar-btc` após publicar o projeto para acessar o monitor público de BTC/USDT Spot.

- Usa WebSocket público da Binance para preço, negócios agregados, candles de 1 minuto e profundidade de 5 níveis.
- Consulta dados públicos de futuros para open interest, mark price e funding, além de eventos públicos de liquidação.
- Calcula CVD Spot aproximado, volume agressor e grandes execuções por limite de valor; isso não identifica carteiras nem confirma a identidade de baleias.
- Não usa chave API, não acessa saldo da conta e não envia ordens.
- Notificações do navegador exigem permissão explícita e a página aberta. Em celulares, o sistema pode suspender a conexão quando o navegador fica em segundo plano.
- Fluxos de ETFs não são apresentados como dados em tempo real, pois não são fornecidos pelos streams públicos da Binance.

O sinal de compra é apenas um filtro técnico configurável para observação; não é recomendação financeira nem garantia de resultado.
