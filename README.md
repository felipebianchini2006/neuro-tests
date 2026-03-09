# Neuro Tests

Aplicação Next.js para aplicação online de dois testes:

- `Arranjo de Figuras`: 11 histórias carregadas dos assets locais.
- `Cubos`: 9 desafios bicolores 2x2 e 3x3.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase para persistência opcional e realtime broadcast
- Vitest para testes de domínio

## Setup

1. Instale dependências:

```bash
npm install
```

2. Gere os assets de sequência a partir da pasta entregue pelo cliente:

```bash
npm run sync:sequence-assets
```

3. Configure as variáveis de ambiente:

```bash
copy .env.example .env.local
```

4. Se for usar Supabase, aplique o schema em [supabase/schema.sql](/c:/projetos/desafios/neuro-tests/supabase/schema.sql).

## Rodando localmente

```bash
npm run dev
```

Abra:

- `http://localhost:3000/admin`
- `http://localhost:3000/p/<token>`
- `http://localhost:3000/o/<token>`

## Modos de execução

- Com `ADMIN_PASSWORD` apenas: painel autenticado + armazenamento em memória local.
- Com `ADMIN_PASSWORD` e chaves do Supabase: persistência em banco + broadcast realtime.

## Validação

```bash
npm test
npm run lint
npm run build
```
