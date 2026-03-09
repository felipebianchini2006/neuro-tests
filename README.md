# Neuro Tests

Aplicacao Next.js para aplicacao online de dois testes:

- `Arranjo de Figuras`: 11 historias carregadas dos assets locais.
- `Cubos`: 9 desafios bicolores 2x2 e 3x3.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase para persistencia opcional e realtime broadcast
- Vitest para testes de dominio

## Setup

1. Instale dependencias:

```bash
npm install
```

2. Gere os assets de sequencia a partir da pasta entregue pelo cliente:

```bash
npm run sync:sequence-assets
```

3. Configure as variaveis de ambiente:

```bash
copy .env.example .env.local
```

Preencha:

- `ADMIN_PASSWORD` para liberar o painel `/admin`
- `NEXT_PUBLIC_SUPABASE_URL` com a URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` para realtime no browser
- `SUPABASE_SERVICE_ROLE_KEY` para persistencia no servidor

4. Se for usar Supabase, aplique o schema em `supabase/schema.sql`.

## Rodando localmente

```bash
npm run dev
```

Abra:

- `http://localhost:3000/admin`
- `http://localhost:3000/p/<token>`
- `http://localhost:3000/o/<token>`

## Modos de execucao

- Com `ADMIN_PASSWORD` apenas: painel autenticado + armazenamento em memoria local.
- Com `ADMIN_PASSWORD` e chaves do Supabase: persistencia em banco + broadcast realtime.

## Validacao

```bash
npm test
npm run lint
npm run build
```
