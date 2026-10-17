# Loja API

API REST em JavaScript com Express, Sequelize, PostgreSQL via `DATABASE_URL` e Supabase Storage para imagens.

## Requisitos

- Node.js 20+
- PostgreSQL acessível via `DATABASE_URL`
- Projeto Supabase com bucket `products` (ou outro nome configurado em `SUPABASE_BUCKET`)

## Instalação

```bash
npm install
```

Copie `.env.example` para `.env` e preencha as variáveis.

```bash
npm run dev
```

Verifique `GET http://localhost:3000/health`.

A aplicação usa `sequelize.sync()` para facilitar o primeiro teste. Para produção, substitua por migrations versionadas. Se estiver usando um banco já existente, confira o esquema e os nomes das colunas antes de iniciar.

## Upload de imagem

`POST /api/products/:id/image` como `multipart/form-data`, campo `image`. Tipos aceitos: JPG, PNG e WebP; limite de 5 MB. O bucket precisa ser público para que a URL pública retornada funcione. Para bucket privado, implemente URLs assinadas.

## Endpoints

Para cada recurso CRUD, exceto `/sales` que tem regras próprias:
- `POST /api/clients`, `/api/users`, `/api/categories`, `/api/products`, `/api/installments`
- `GET /api/<recurso>`
- `GET /api/<recurso>/:id`
- `PUT /api/<recurso>/:id`
- `DELETE /api/<recurso>/:id`

Vendas:
- `POST /api/sales/complete` cria venda com produtos e parcelas em transação.
- `POST /api/sales` cria venda simples.
- `GET /api/sales`, `GET /api/sales/:id`, `PUT /api/sales/:id`, `DELETE /api/sales/:id`

## Observações importantes

- `product.category_id` foi mantido como `unique`, conforme o esquema fornecido. Isso limita cada categoria a um único produto. Remova `unique: true` se uma categoria puder ter vários produtos.
- Como `product_sale` não possui coluna `quantity`, cada ocorrência do ID de produto no array `products` representa uma unidade. Ex.: `[1, 1, 2]` vende duas unidades do produto 1 e uma do produto 2.
- `value` e `amount` seguem o esquema original (`DOUBLE`). Para dinheiro em produção, prefira `DECIMAL` e faça cálculos monetários com precisão decimal.
- O CRUD de usuários não retorna o hash de senha, mas endpoints de administração precisam de autenticação/autorização antes de expor a API publicamente.
- O código valida MIME e tamanho no upload, mas uma aplicação pública deve também validar o conteúdo real do arquivo, proteger rotas e aplicar limites de requisições.
