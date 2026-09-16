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

## Development

```
bun install
bun run dev:full
```
