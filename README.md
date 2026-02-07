# Ops Command Centre

Production-grade operations cockpit focused on **fast capture of messy dumps** that auto-structure into live KPI dashboards. Built as a TypeScript monorepo.

## Stack
- **Frontend:** Next.js (App Router) + Tailwind
- **Backend:** NestJS (clean separation from web UI)
- **DB:** Postgres + Prisma
- **Queue:** BullMQ + Redis
- **Realtime:** Server-Sent Events (SSE). Chosen for simple push-to-dashboard updates without socket handshake overhead. Works well for one-way KPI updates.
- **Parsing:** Rule-based pipeline with optional LLM provider abstraction

## Repo layout
```
/apps/web        # Next.js UI
/apps/api        # NestJS API
/apps/worker     # BullMQ worker
/packages/shared # shared types + zod schemas
/packages/parser # parsing pipeline + tests
```

## Setup (local dev)
### Prereqs
- Node 18+
- pnpm
- Docker (for Postgres + Redis)

### Start services
```bash
pnpm install

docker compose up -d postgres redis
pnpm --filter @ops/api prisma migrate deploy
pnpm --filter @ops/api db:seed
pnpm --filter @ops/api demo:seed

pnpm dev
```

Open:
- Web: http://localhost:3000
- API: http://localhost:4000

### With Docker Compose (all services)
```bash
docker compose up
```

## Environment variables
| Service | Variable | Description |
| --- | --- | --- |
| api | DATABASE_URL | Postgres connection string |
| api | REDIS_URL | Redis connection string |
| api | PORT | API port (default 4000) |
| web | NEXT_PUBLIC_API_URL | API URL (default http://localhost:4000) |
| web | NEXT_PUBLIC_DEMO_USER_ID | Demo user id for local auth (default `00000000-0000-0000-0000-000000000001`) |

## Demo steps (live updates)
1. Run `pnpm --filter @ops/api db:seed` and `pnpm --filter @ops/api demo:seed`.
2. Open the web dashboard.
3. Paste a messy dump in the Dump box and submit.
4. Watch the Inbox + KPIs update live (SSE).

## How to test live updates
- Open two browser tabs at the dashboard.
- Submit a new dump in one tab.
- Observe KPIs and Inbox update in the other without refresh.

## Testing
```bash
pnpm --filter @ops/parser test
```

## Notes
- **Auth:** simplified header-based demo auth (`x-user-id`). Swap for NextAuth or JWT session cookies in production.
- **LLM:** optional provider interface ready for OpenAI/other integrations, with deterministic rule-based fallback.
