# Creative Intelligence PoC — Project Status & Handoff

**Last updated:** 2026-07-07 · **Branch:** `claude/viral-video-discovery-research-icqjzf` · **Latest commit:** `775c854`

> Single source of truth for resuming this project in a fresh session. Read this
> first, then the per-iteration reports (`01`–`05`) for detail.

---

## What this project is

A **standalone PoC** validating an AI-assisted content-research workflow for a
marketing agency, on the test client **SPH Auto Parts** (automotive parts, Toronto).
It is deliberately separate from the agency's existing GBP/"Google Management"
platform — it reuses concepts (Brand DNA, Knowledge Base, Planner) only through
clean port interfaces, never that platform's code.

- **Repo:** `canversad/ALIREZA` — contains `research/`, `design/`, and `poc/creative-intelligence/`.
- **App location:** `poc/creative-intelligence/` (Next.js 15 + TypeScript strict + Tailwind, SQLite via `node:sqlite`).
- **Design/research basis:** `research/viral-video-discovery.md`, `design/content-research-workflow.md`.

Workflow spine (design doc): Research Hub → Trend Radar → Opportunity Detail →
Deep AI Analysis → Brief Editor → Meeting Mode → Content Planner. Everything is
one "Opportunity" object moving through a state machine.

---

## Status by iteration

| # | Screen / capability | Status | Report |
|---|---|---|---|
| 1 | Scaffold + Research Hub | ✅ done | `01-research-hub.md` |
| 2 | Trend Radar (feed, filters, shortlist/reject, learning signals) | ✅ done | `02-trend-radar.md` |
| 3 | Opportunity Detail (permanent evidence page, section registry) | ✅ done | `03-opportunity-detail.md` |
| 4 | Deep AI Analysis (Claude adapter + fixture fallback, gated + cached) | ✅ done | `04-deep-ai-analysis.md` |
| 5 | Real YouTube Data API v3 discovery provider | ✅ done | `05-youtube-discovery.md` |

**Verified working locally with REAL data on the user's Windows machine:**
Claude Opus 4.8 analysis ✅, YouTube Data API v3 discovery ✅.

---

## Architecture (hexagonal-lite — do not redesign)

```
src/core/domain     pure types + Opportunity state machine (no I/O, no framework)
src/core/ports      interfaces: DiscoveryProvider, AnalysisEngine, OpportunityRepository,
                    BrandDNAPort, ClientPort, KnowledgeBasePort, PlannerPort, PublishedContentPort
src/core/services   scoring, hub digest, feed, learning, similarity, dossier
src/adapters        fixtures/, sqlite/, discovery/ (youtube, composite, factory),
                    analysis/ (claude, fixture), container.ts (the ONLY wiring point)
src/app             Next.js screens + server actions
scripts             seed.ts, probe-youtube.ts, validate-runtime.mjs
```

Rules held throughout: `core/` imports nothing from `adapters/`/`app/`; every metric
carries `provenance` (fixture/official-api/scraper) shown as a UI badge; Brand DNA & KB
are read-only through ports.

### Provider selection (the "activate on key" pattern)
- **Discovery:** `YOUTUBE_API_KEY` present → real YouTube provider; absent → fixture.
- **Analysis:** `ANTHROPIC_API_KEY` present → Claude (`claude-opus-4-8`); absent → heuristic fixture engine.
- **Deterministic overrides** (pin regardless of keys — used to keep the test suite stable):
  `CI_DISCOVERY_PROVIDER=fixture|youtube`, `CI_ANALYSIS_PROVIDER=fixture|claude`.

---

## How to run & verify (Windows, in `poc/creative-intelligence/`)

```bash
git pull
npm install
# .env.local holds the real keys (gitignored): ANTHROPIC_API_KEY, YOUTUBE_API_KEY, CI_ANALYSIS_MODEL
npm run probe:youtube        # structural live test of the real YouTube provider
npm run seed -- --reset      # harvests REAL data when keys present (fixed to load .env.local)
npm run dev                  # http://localhost:3100 — terminal logs which engine/provider was picked
```

Regression suite (pinned to fixtures, deterministic even with real keys present):
```bash
npm run seed:fixture
npm run start:fixture &      # runs the app pinned to fixture data
npm run validate             # typecheck + lint + build
npm run validate:runtime     # 63-check Playwright suite
```

Diagnostic lines printed on first container init confirm what was selected:
`[creative-intelligence] YOUTUBE_API_KEY detected — discovery provider: youtube-data-api-v3`

---

## Key gotchas already solved (don't re-debug these)

1. **`.env.local` not loading in scripts** — `tsx` scripts don't get Next.js's auto env
   loading. `seed.ts` and `probe-youtube.ts` load it explicitly via `dotenv` (`.env.local` then `.env`).
   This was the "seed still uses fixtures" bug (fixed in `775c854`).
2. **YouTube 403 "method ... are blocked"** — NOT a code bug. It's a Google Cloud **API-key
   restriction** (key restricted to APIs that exclude YouTube Data API v3). Fix in Cloud
   Console → Credentials → key → API restrictions. Resolved by the user.
3. **Regression suite vs real keys** — a real `ANTHROPIC_API_KEY`/`YOUTUBE_API_KEY` would make
   the fixture-content assertions fail. Solved with the `CI_*_PROVIDER=fixture` pins +
   `seed:fixture` / `start:fixture` scripts.
4. **Real videos have no hand-labeled format** — a keyword classifier best-guesses; falls back
   to `"unclassified"` (neutral scoring weight) rather than faking precision.

---

## OPEN ITEMS — next steps (in recommended order)

### 1. Discovery relevance gate  ⬅ recommended next (user flagged this)
**Problem the user reported:** real YouTube results are too broad — some high-view videos
aren't about automotive-parts retail. Root cause: brand-fit is a **ranking signal only**
(25% weight), so an off-topic viral video still floats up because virality is 40%.
**Smallest fix:** promote brand-fit to a **hard inclusion gate at harvest time** in
`src/adapters/seed-harvest.ts` (drop videos below a brand-fit threshold before they become
opportunities) + construct more specific search queries in the YouTube provider (e.g.
`"auto parts brake replacement"` instead of bare `mechanic`). Optional higher-quality
variant: a cheap Haiku relevance-classification pass at harvest. The design doc already
anticipated this ("hard gates: reach floor + brand fit"). ~15–30 lines, no architecture change.
**User instruction was "do not implement yet" — awaiting go-ahead.**

### 2. TikTok via ScrapeCreators
Highest-value source per the research. One-line add to the discovery factory
(`src/adapters/discovery/index.ts`) + a `ScrapeCreatorsProvider` mirroring the YouTube one.
**Note:** this sandbox CANNOT reach scrapecreators.com — verification must happen on the
user's machine (same as the Anthropic/YouTube keys).

### 3. Vercel deployment
User wants a brand-new independent Vercel project named `creative-intelligence` connected to
this GitHub repo, WITHOUT touching existing production/redirect projects. Paused earlier.
No Vercel CLI/MCP in this sandbox — deployment steps run on the user's side. NOTE: SQLite via
`node:sqlite` is filesystem-based and ephemeral on Vercel serverless — a persistence swap
(the `OpportunityRepository` port makes this clean) is needed before/at deploy.

### 4. Phase 2 screens (not started)
Brief Editor (design Screen 5, converts an analyzed Opportunity into a pitchable brief with
approval gate A2) and Meeting Mode (Screen 6). These are the convergence toward the Content
Planner handoff.

---

## Working agreement / process (keep doing this)
- One screen/capability per iteration; static validation → runtime validation → report → commit/push → stop for approval.
- Real API keys stay in the user's local `.env.local` (gitignored); never commit keys.
- The sandbox can reach `googleapis.com` (YouTube) but NOT `scrapecreators.com` — plan verification accordingly.
- Every quantitative claim carries provenance; no faked numbers or invented precision.
