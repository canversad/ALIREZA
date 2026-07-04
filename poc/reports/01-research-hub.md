# Implementation Report — Iteration 1: Scaffold + Research Hub

**Date:** 2026-07-04 · **Status:** ✅ complete, all validations green · **Awaiting:** approval to start Iteration 2 (Trend Radar)

## What was built

`poc/creative-intelligence/` — a standalone Next.js 15 + TypeScript (strict) app, independent of the GBP application, with the architecture the PoC will carry through all iterations:

| Layer | Delivered |
|---|---|
| `src/core/domain` | Full Opportunity model (both paths), VideoEvidence with per-metric **provenance**, ScoreBreakdown with per-component reasons, lifecycle **state machine** (discovered → … → planned, with legal-transition enforcement) |
| `src/core/ports` | All seven interfaces the whole PoC will use: `DiscoveryProvider`, `AnalysisEngine`, `OpportunityRepository`, `BrandDNAPort`, `ClientPort`, `KnowledgeBasePort`, `PlannerPort` — Brand DNA & KB are reachable **only** through ports (integration constraint honored from day 1) |
| `src/core/services` | **Opportunity Score** (virality 40% · brand-fit 25% · adaptability 20% · freshness/locality 15%), each component with a plain-language reason; hub digest builder |
| `src/adapters` | SQLite repository via Node's built-in `node:sqlite` (zero native deps, no Firebase coupling), fixture Brand DNA/client ports, fixture discovery provider (37 realistic SPH Auto Parts videos incl. one deliberate guardrail-violation case), composition root with idempotent auto-seed |
| `src/app` | **Research Hub screen** per design §Screen 1: client header, "since your last visit" digest with HOT previews and evidence strings, three mode doors (Trend Radar live → stub route; Idea Studio & Meeting Prep visibly locked "Phase 2"), pipeline strip, keyword-universe footer, global **fixture-data badge** |

Not built (deliberately): Trend Radar feed, detail view, any AI calls, Brief/Meeting screens, planner stub — later iterations per your instruction.

## Static validation

| Check | Result |
|---|---|
| `tsc --noEmit` (strict) | ✅ 0 errors |
| `eslint` (next/core-web-vitals + next/typescript) | ✅ 0 errors, 0 warnings (engagement verified) |
| `next build` (production) | ✅ all routes compile; hub/radar dynamic, ~106 kB first-load JS |

## Runtime validation

Production server (`next start`) driven by Playwright (`scripts/validate-runtime.mjs`). The script **reads expected values from the SQLite store first, then asserts the DOM matches** — proving the UI renders persisted data, not hardcoded strings. 14/14 checks passed:

```
DB expectations: total=37 new(7d)=37 hot=11
PASS  seeded store is non-empty · root redirects to client hub · client name rendered
PASS  digest new-count matches DB · digest hot-count matches DB · local signals rendered
PASS  hot previews rendered (≤3) · pipeline discovered-count matches DB
PASS  shortlisted/analyzed/briefed are 0 on fresh seed · fixture-data badge visible
PASS  Trend Radar door navigates · no horizontal overflow at 420px
```

Screenshots: [`assets/hub-desktop.png`](assets/hub-desktop.png) · [`assets/hub-mobile.png`](assets/hub-mobile.png)

## How to run it

```bash
cd poc/creative-intelligence
npm install && npm run dev     # http://localhost:3100 — auto-seeds on first run
npm run validate               # typecheck + lint + build
npm run start & npm run validate:runtime   # the 14-check Playwright suite
```

## Known limitations / honest notes

1. **All data is fixture data** (badged in the UI). Metric shapes are modeled on the feasibility research; real ScrapeCreators/YouTube adapters plug into the existing `DiscoveryProvider` port in a later iteration (this sandbox blocks platform egress and has no API keys — real-data runs happen on your machine with `.env` keys).
2. **HOT calibration:** 11/37 fixtures flag as hot (velocity ≥ ~105K views/day within 7 days). With real harvest data this threshold needs tuning against a strategist's gut — flagged as a validation item for real-user testing.
3. "Last visit" is a fixed trailing 7-day window (labeled as such); real per-user visit tracking is a later nicety.
4. The scoring weights (40/25/20/15) are the design doc's starting point, isolated in one constant — expect to tune during user testing.
5. `node:sqlite` prints an "experimental" warning on Node 22 — cosmetic; the API is stable in Node 24 if we ever care.

## Proposed next iteration (awaiting your approval)

**Iteration 2 — Trend Radar:** ranked feed with score chips ("why here"), platform/window/format filters, hide-seen, Shortlist ★ and Reject-with-reason actions (persisted through the state machine + KB decision log), hot section, provenance badges per card. Same validation protocol: static + Playwright runtime + report.
