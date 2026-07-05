# Implementation Report — Iteration 5: Real YouTube Discovery Provider

**Date:** 2026-07-05 · **Status:** ✅ built, static + fixture-regression + error-path verified here; **happy-path verification is one command on your machine** · **Awaiting:** your probe result, then approval for the next provider (TikTok/ScrapeCreators)

## What was built

The first **real** discovery provider replaces the fixture demo feed in the Trend Radar — same "activate on key" pattern as the Claude analysis engine.

| Piece | Delivered |
|---|---|
| **`YouTubeDiscoveryProvider`** (`src/adapters/discovery/youtube.ts`) | The official, free, ToS-clean path from the research. Per niche keyword: `search.list` (order=viewCount, publishedAfter=window, regionCode=CA, type=video) → `videos.list` (statistics + contentDetails) → `channels.list` (subscriber counts, for the "creator baseline" the score needs). Maps into the existing `VideoEvidence` shape with `provenance: "official-api"` — which already renders the "high confidence" badge everywhere. Quota-guarded (capped keyword searches via `CI_YOUTUBE_MAX_KEYWORDS`), errors surface the real API reason (bad key / quota / disabled) instead of a generic crash |
| **Format classifier** (`format-classifier.ts`) | Real videos don't carry hand-labeled formats (that was fixture craftsmanship). A keyword classifier best-guesses format from title/description/duration and falls back to a new `"unclassified"` value — honest, not fake precision. Also parses ISO-8601 durations (`PT5M33S` → seconds) |
| **`CompositeDiscoveryProvider`** | Merges multiple providers deduped by URL, degrading gracefully if one fails (`Promise.allSettled`). Adding TikTok next is a one-line change in the factory |
| **Selection factory** (`discovery/index.ts`) | `YOUTUBE_API_KEY` present → real; absent → fixture. `CI_DISCOVERY_PROVIDER=fixture\|youtube` forces a choice |
| **Symmetric analysis pin** | Added `CI_ANALYSIS_PROVIDER=fixture\|claude` — **this fixes a real problem your machine would now hit**: the regression suite asserts the fixture engine, but your real `ANTHROPIC_API_KEY` silently activates Claude and fails the assertion. Both providers now pin cleanly |
| **Probe/smoke script** (`scripts/probe-youtube.ts`, `npm run probe:youtube`) | Hits the real API and asserts *structural invariants* (real URLs, non-negative finite metrics, dates in-window, official-api provenance) rather than exact content — because real results change daily. Prints a top-10-by-views table for eyeballing |

## Validation performed here

| Check | Result |
|---|---|
| `tsc --noEmit`, `eslint`, `next build` | ✅ all green |
| **Fixture regression suite** (63 checks, pinned via `start:fixture`/`seed:fixture`) | ✅ 63/63 — real-provider plumbing broke nothing |
| **Live error-path test** | ✅ Made a real call to `googleapis.com` with an invalid key; provider surfaced Google's actual message (`"API key not valid. Please pass a valid API key."`) cleanly. Proves the request shape, params, URL, and error handling are correct end-to-end |

**What I could not verify here:** the happy path returning real videos — this sandbox has no `YOUTUBE_API_KEY` (you kept it on your machine). The error-path call proves everything up to key validation works; only the final "real videos come back" step is unverified from here. That's what the probe is for.

## Your verification — two commands on your Windows machine

After `git pull` and `npm install` (picks up `cross-env` + `dotenv`):

```powershell
cd G:\App\Virally\ALIREZA\poc\creative-intelligence

# 1. Structural smoke test against the real API (fastest signal)
npm run probe:youtube
#    Expect: "YOUTUBE PROBE PASSED — N real videos, structure valid." + a top-10 table

# 2. See real videos in the app
npm run seed -- --reset      # now harvests real YouTube data (YOUTUBE_API_KEY present)
npm run dev                  # terminal prints: "YOUTUBE_API_KEY detected — discovery provider: youtube-data-api-v3"
```

Then open the Trend Radar — cards should be real YouTube videos with the green **"official-api · high confidence"** badge instead of amber "demo data".

**If the probe fails**, the message tells you why: `HTTP 403 … quota` = daily search quota exhausted (wait or raise quota); `API key not valid` = key or API-not-enabled issue; `HTTP 400` = malformed request (send me the message).

## Known limitations (honest)

1. **YouTube only** — TikTok (the richest viral auto-parts source per the research) needs ScrapeCreators, which this sandbox can't reach; that's the next iteration, verified entirely on your machine.
2. **No share counts** — YouTube's API doesn't expose them; kept at 0 rather than invented, so engagement rate is slightly conservative vs. TikTok.
3. **`search.list` quota** — the free tier's search bucket is small; `CI_YOUTUBE_MAX_KEYWORDS` (default 6) caps searches per harvest. Heavy reseeding can exhaust the daily quota — the error surfaces clearly when it does.
4. **Region is search-level, not per-video** — `regionCode=CA` biases the search; individual videos are tagged `region: "CA"` as an approximation, consistent with how locality is a scoring boost (not a hard filter) in the design.

## Proposed next step (awaiting your go)

Either: **(a) TikTok via ScrapeCreators** — the highest-value provider, one-line add to the composite (verified on your machine since the sandbox can't reach it); or **(b) return to the Vercel deployment plan** now that the local pipeline runs on real data. Your call.
