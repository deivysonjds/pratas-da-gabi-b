# API Pratas da Gabi

API Express + Sequelize + PostgreSQL/Supabase, com JWT (HS256), refresh token rotativo, cookies HttpOnly, CORS por allowlist, rate limit, sanitização de entradas e upload de imagens no Supabase Storage.

## Configuração local

1. Copie `.env.example` para `.env` e configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (ou, alternativamente, `DATABASE_URL`), `ACCESS_TOKEN_SECRET` (segredo aleatório de pelo menos 32 caracteres), credenciais do Supabase Storage e `CORS_ORIGINS=http://localhost:3000`.
2. Para Supabase, copie host, usuário e porta do mesmo método de conexão em **Connect**: a conexão direta `db.<project-ref>.supabase.co` normalmente usa o usuário `postgres`; o Session Pooler usa o host/porta do pooler e frequentemente o usuário `postgres.<project-ref>`. Não misture o host direto com o usuário do pooler. `DB_SSL=true` ativa TLS com validação do certificado; use o certificado CA confiável quando sua rede exigir uma CA específica. Não desative a validação em produção.
3. Instale dependências: `npm install`.
4. Execute migrations: `npm run db:migrate`.
5. Crie o primeiro usuário administrativo: `npm run user:create`.
6. Inicie: `npm run dev` (API em `http://localhost:3333`).

## Frontend Next.js

O frontend usa um rewrite same-origin `/backend/*` para encaminhar à API e permitir cookies HttpOnly no domínio do frontend. Em local, `API_PROXY_TARGET=http://localhost:3333`. Em produção, configure `API_PROXY_TARGET` com a URL raiz do backend, por exemplo `https://seu-backend.onrender.com`, e `NEXT_PUBLIC_API_URL=/backend/api`. Não inclua `/api` no `API_PROXY_TARGET`.

No backend em produção, configure `CORS_ORIGINS` com a origem exata do frontend (por exemplo `https://seu-site.vercel.app`), `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none`, `NODE_ENV=production` e `TRUST_PROXY=true` se o host estiver atrás de um proxy confiável. Em local, os defaults são adequados para `http://localhost:3000`.

## Rotas públicas

- `GET /health`: verificação de disponibilidade.
- `POST /api/auth/login`: autentica email/senha, define cookies HttpOnly e devolve dados do usuário.
- `POST /api/auth/refresh`: usa refresh cookie, revoga o refresh token anterior e emite um novo par.
- `POST /api/auth/logout`: revoga o refresh token e limpa cookies.
- `GET /api/products`: catálogo público para a vitrine.
- `POST /api/sales`: finaliza pedido público, valida cliente/produtos/estoque e registra a venda atomicamente.

Todas as demais rotas de `/api` exigem JWT válido, via cookie HttpOnly ou `Authorization: Bearer <JWT>`. O middleware do Next.js 16 (arquivo `proxy.ts`) bloqueia navegação sem cookies de sessão; a API continua sendo a autoridade final de autenticação e autorização.

## Segurança

- JWT de acesso HS256 com expiração curta; refresh token aleatório, armazenado somente como hash e rotacionado a cada renovação.
- Cookies `HttpOnly`; `Secure` e `SameSite` configuráveis.
- CORS com origens explícitas, verificação de `Origin` em mutações, Helmet, limite de payload e rate limit global, de autenticação e de pedidos.
- Sanitização XSS de campos textuais e allowlists de campos nos CRUDs; senhas/tokens não são alterados pelo sanitizador para preservar autenticação.
- Sequelize usa consultas parametrizadas; validações adicionais nos controladores.
- A chave `SUPABASE_SERVICE_ROLE_KEY` fica somente no backend. Nunca use prefixo `NEXT_PUBLIC_` para ela.

## Migrations

A migration `202610180001-product-category-many-to-one.js` remove a restrição UNIQUE de `product.category_id`, permitindo vários produtos na mesma categoria, como esperado em uma loja. Se a migration anterior já tiver sido executada, aplique as migrations pendentes com `npm run db:migrate`.

## Limites conhecidos

O esquema fornecido de `product_sale` não guarda quantidade nem preço histórico; para representar quantidades, o backend grava uma linha por unidade e calcula o total a partir do preço atual do produto. Para preservar preços históricos e simplificar relatórios, recomenda-se adicionar `quantity` e `unit_price` em `product_sale` em uma migration futura.
