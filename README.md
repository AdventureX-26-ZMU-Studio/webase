# ZMU Webase

ZMU Studio backend foundation on Cloudflare Workers.

## Architecture

- Frontend: Vite, built to `dist/client`
- Backend: Hono Worker at `src/worker/index.ts`
- Static assets: served through `env.ASSETS`
- Storage bindings:
  - D1: `env.d1`
  - KV: `env.kv`
  - R2: `env.MY_BUCKET`

## Development

```bash
npm run dev
```

Runs the Vite frontend server for quick interface work.

```bash
npm run worker:dev
```

Builds the frontend, then runs the full Worker on port `8787` with Hono APIs and Cloudflare local bindings.

Apply local D1 migrations before testing auth:

```bash
npx wrangler d1 migrations apply zmu-proj-d1 --local
```

Use `wrangler dev --remote` only when you intentionally want to touch remote Cloudflare resources.

## Deployment

```bash
npm run deploy
```

The deploy script builds Vite first, then deploys the Worker with assets.

The Worker also creates the minimal auth table with `CREATE TABLE IF NOT EXISTS`
when auth/admin routes are used. Remote migrations are still kept for explicit
database management:

```bash
npx wrangler d1 migrations apply zmu-proj-d1 --remote
```

## Route Geometry

- `/` - backend console shell
- `/auth` - frontend route handled by Vite assets fallback
- `/storage` - frontend route handled by Vite assets fallback
- `/settings` - frontend route handled by Vite assets fallback
- `/api/health` - health check
- `/api/auth/register` - create user and session
- `/api/auth/login` - create session
- `/api/auth/logout` - destroy session
- `/api/auth/me` - current user
- `/api/admin/overview` - protected backend panel summary
- `/api/r2/:key` - protected R2 request-backed object entry
