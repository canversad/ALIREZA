# Creative Intelligence — Standalone PoC

Proof of concept for the AI-assisted content research workflow
(**Research Hub → Trend Radar → Opportunity Detail → AI Analysis → Brief → Meeting Mode**),
built to validate the workflow with real users **before** integration into the main platform.

Design source: `../../design/content-research-workflow.md`
Feasibility research: `../../research/viral-video-discovery.md`

## Quick start

```bash
npm install
npm run dev        # http://localhost:3100 — auto-seeds fixture data on first run
```

Useful commands:

```bash
npm run seed -- --reset   # wipe + reseed the local store
npm run validate          # static validation: typecheck + lint + build
npm run validate:runtime  # drives the running app with Playwright (needs dev/start running)
```

## Status

| Iteration | Screen | Status |
|---|---|---|
| 1 | Research Hub (+ scaffold, domain, scoring, fixtures) | ✅ approved |
| 2 | Trend Radar (feed, filters, decisions, learning signals) | ✅ approved |
| 3 | Opportunity Detail (permanent evidence page, section registry) | ✅ this iteration |
| 4 | AI Analysis (Claude adapter + fixture fallback) | — |
| 5 | Brief Editor | — |
| 6 | Meeting Mode | — |
| 7 | Planner hand-off stub + integration adapters | — |

## Architecture (integration-ready by construction)

```
src/core/domain     pure types + Opportunity state machine (no I/O, no framework)
src/core/ports      interfaces: DiscoveryProvider, AnalysisEngine, OpportunityRepository,
                    BrandDNAPort, ClientPort, KnowledgeBasePort, PlannerPort
src/core/services   Opportunity scoring, hub digest
src/adapters        fixtures/ (demo data + fixture provider), sqlite/ (node:sqlite repo),
                    container.ts (the only wiring point)
src/app             Next.js screens + (later) API routes
```

Rules enforced by layout:

- `src/core` never imports from `src/adapters` or `src/app`.
- **Brand DNA and Knowledge Base are read/written only through ports** — the real
  platform supplies its own adapters at integration time; nothing else changes.
- Persistence is SQLite behind `OpportunityRepository` (constraint: no Firebase
  coupling; the adapter is swappable without refactoring).
- Every metric carries `provenance` (`fixture` / `official-api` / `scraper`) and the
  UI badges it — no number without a source.

## Data

The PoC currently runs on a **fixture dataset** (39 fabricated-but-realistic videos for
the SPH Auto Parts test client, metric shapes modeled on the feasibility research).
Real discovery adapters (ScrapeCreators, YouTube Data API) and the Claude analysis
adapter activate via `.env` keys in later iterations — see `.env.example`.
