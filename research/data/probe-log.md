# Live Probe Log — 2026-07-04

Evidence gathered during the research sprint. Probes ran from a sandboxed Claude Code
cloud container and from Claude's server-side WebSearch/WebFetch tools.

## Probe 1 — yt-dlp against YouTube search (BLOCKED BY SANDBOX, not by YouTube)

- Script: `yt_probe.py` (in this directory). Strategy: YouTube search URL with
  `sp=CAMSBAgEEAE=` (protobuf filter: sort=view count, upload date=this month,
  type=video) for 8 auto-niche queries, flat-extract top 15 per query, then full
  metadata extraction (views/likes/comments/upload_date) for the top 30 candidates.
- Result: **0 results for all queries.** Root cause confirmed via the container's
  egress proxy status endpoint: `gateway answered 403 to CONNECT (policy denial)`
  for `www.youtube.com:443`. The sandbox network policy only whitelists package
  registries; youtube.com and reddit.com are unreachable.
- Interpretation: this is an **environment constraint, not a platform finding**.
  The same script on an unrestricted network is expected to work (yt-dlp 2026.06.09
  actively maintains YouTube extractors). It is included as a ready-to-run PoC asset.

## Probe 2 — Reddit public JSON (BLOCKED BY SANDBOX)

- `curl https://www.reddit.com/r/{Justrolledintotheshop,MechanicAdvice,AutoDetailing,cars}/top.json?t=month`
- Result: `curl: (56) CONNECT tunnel failed, response 403` for all four — same
  egress-policy denial. Not a Reddit-side block.

## Probe 3 — Claude-native WebSearch as a discovery engine (RAN — graded honestly)

Queries run exactly as an agent would for the SPH Auto Parts test case:

1. `viral TikTok video mechanic auto parts June 2026 millions views`
   - Returned: TikTok *discover/tag* surface pages (`tiktok.com/tag/mechanic`,
     `tiktok.com/discover/funny-auto-mechanic-videos`), creator profiles, one
     concrete video URL (`@royaltyautoservice/video/7390496094339239211`) — but the
     only story with view numbers was a **June 2024** Slashdot article (301K views).
     No fresh (≤30d) ranked results, no engagement metrics.
2. `most viewed YouTube Shorts car repair brake job posted this month engagement`
   - Returned: all-time-record listicles, channel directories, ONE relevant Short
     ("Brake Jobs Aren't Just Pads", Dylan's Diag, May 2026) — **without any view
     count**. The tool itself concluded "search results do not provide view counts
     or engagement metrics."

**Grade vs. success criteria:** finds niche surfaces and occasional individual
videos (discovery: partial), cannot produce a ranked recent top-20, cannot supply
views/likes/comments (metrics: fail), cannot filter by publish window (recency:
fail). Matches the pre-registered hypothesis.

## Probe 4 — Claude-native WebFetch on platform pages (RAN — hard fail)

- `WebFetch https://www.tiktok.com/@royaltyautoservice/video/7390496094339239211`
  → **HTTP 403 Forbidden** (TikTok blocks the server-side fetcher).
- `WebFetch https://www.youtube.com/shorts/...` → **HTTP 403 Forbidden**.
- `WebFetch https://developers.google.com/...` and `https://apify.com/...` also 403
  — Google and Apify block Anthropic's fetcher too. WebFetch is not a viable
  metrics-acquisition path for any relevant platform.

## Conclusion from probes

Claude's native tooling alone: **discovery = weak/partial, metrics = zero.**
Reliable acquisition requires platform APIs (YouTube) and commercial scraper APIs
(TikTok/Instagram). Direct-scraping probes must be re-run in the PoC on an
unrestricted network; this sandbox cannot reach the platforms at all.
