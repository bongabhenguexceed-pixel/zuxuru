# Zuxuru

Digital Investigation & Visibility Platform. Investigate. Understand. Improve. Grow.

Built on the Shogo app runtime: Vite + React + Tailwind + shadcn/ui frontend, Hono + Prisma (SQLite) backend.

## Architecture

Zuxuru follows a strict 7-layer pipeline (see `src/lib/zuxuru/`):

1. **Business database** (`business-db.ts`) — persistence only
2. **Public Intelligence Engine** (`intelligence-engine.ts`) — collects public + connected evidence
3. **Scoring Engine** (`scoring-engine.ts`) — transparent, weighted 0-100 scoring across 7 dimensions
4. **Opportunity Engine** (`opportunity-engine.ts`) — deduped findings + ranked opportunities
5. **AI Execution Layer** (`execution-engine.ts`) — actions, content studio, distribution
6. **Monitoring Engine** (`monitoring-engine.ts`) — re-investigation + rescoring loop
7. **Dashboard** (`src/components/zuxuru/*`) — React UI

`src/lib/zuxuru/index.ts` orchestrates the pipeline: DISCOVER → SCORE → CONNECT → RECOMMEND → EXECUTE → MONITOR → RESCORE.

## Setup

This repo contains all hand-written application code. Two categories of boilerplate are intentionally **not** committed (regenerate them locally after cloning):

```bash
bun install

# 1. Restore the generated Prisma client + CRUD routes from prisma/schema.prisma
bun x shogo generate

# 2. Restore the stock shadcn/ui primitives used by the dashboard
bunx shadcn@latest add accordion alert avatar badge button card checkbox dialog \
  dropdown-menu input label popover progress scroll-area select separator sheet \
  skeleton switch table tabs textarea tooltip

# 3. Run it
bun run dev:full
```

## Development

```
bun install
bun run dev:full
```
