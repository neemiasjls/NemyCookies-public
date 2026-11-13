# NemyCookies

Site de pedidos e painel de gestão de um delivery de cookies artesanais, em uso no dia a dia do negócio.
O cliente faz o pedido pelo site; o dono controla tudo pelo painel, pensado primeiro para o celular.

> Vitrine pública: o código é o mesmo do sistema em produção, sem dados do negócio. Contatos e endereços
> foram trocados por exemplos.

## O que faz

**Site do cliente**
- Cardápio com os sabores, carrinho e checkout com entrega ou retirada
- Pagamento pelo Mercado Pago
- Programa de fidelidade: o cliente entra pelo telefone e acompanha os pontos

**Painel do dono** (`/admin`)
- **Fiado:** caderneta dos estabelecimentos parceiros (quem comprou, quanto deve, quando pagou)
- **Vendas, pedidos e pedido manual:** os três canais de venda (site, fiado e venda direta)
- **Estoque, produção e compras:** lotes de produção, gastos e o custo real de cada sabor
- **Precificação e histórico:** margem por sabor e evolução das vendas
- **Etiquetas:** gera as etiquetas dos produtos em PDF

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind, React Router |
| Backend | Supabase: PostgreSQL com RLS, funções SQL e Edge Functions |
| Pagamento | Mercado Pago |
| PDF | pdf-lib (etiquetas) |
| Hospedagem | Cloudflare Pages, com CSP conferida no build |

## Rodar localmente

```bash
cd frontend
cp .env.example .env   # preencha com o seu projeto Supabase e a chave pública do Mercado Pago
npm install
npm run dev
```

O banco e as Edge Functions ficam no Supabase e não fazem parte deste repositório.
