# Research Sprint: Can an AI System Reliably Discover Recently Viral Niche Videos?

**Date:** 2026-07-04
**Test case:** SPH Auto Parts · Automotive Parts · Toronto
**Target output:** Top 20 viral videos ≤30 days old, each with URL, platform, creator, publish date, estimated views, likes, comments, engagement, virality rationale, confidence.

---

## Verdict

**Yes — reliably, with the right acquisition stack. No — with LLM/web-search tools alone.**

| Claim | Evidence |
|---|---|
| TikTok discovery with full metrics (plays, likes, comments, shares, publish timestamp, keyword + period filters) is a solved commercial problem | EnsembleData/ScrapeCreators/Apify/Bright Data all expose TikTok keyword & hashtag search returning `play_count`, `comment_count`, `share_count`, with time-period and country parameters, at $0.30–$2 per 1,000 videos |
| YouTube discovery is fully official, free, and legal | Data API v3: `search.list(publishedAfter, order=viewCount, regionCode=CA)` + `videos.list(statistics)`. Caveat: since June 1 2026, `search.list` has its own ~100-calls/day bucket — enough for ~5–10 client niches per project per day, and multiple projects/quota extensions are available |
| Instagram is the *worst* first platform, not the default one | Official Graph API: no keyword search, 30 hashtags/week, and Meta stripped view counts from third-party post/reel lookups in 2026. Only scrapers work, at higher cost and fragility |
| LLM search tools cannot do this alone | Live probes (Appendix A): Claude WebSearch found tag pages and a 2024 news story but zero fresh ranked results and zero metrics; WebFetch is 403-blocked by TikTok, YouTube, Google, and Apify |
| Legal posture is manageable | Meta v. Bright Data (N.D. Cal., Jan 2024): logged-out scraping of public data does not breach Meta's ToS; hiQ line: public scraping isn't a CFAA violation. Residual risk is contractual (platform ToS) and privacy-law (PIPEDA/GDPR) — mitigated by using vendors and storing only public post-level metrics |

The honest weak spots: **"Toronto" cannot be a hard filter** (viral content doesn't carry reliable geo-data; treat locality as a scoring boost, not a gate), and **"estimated views" on Instagram post-2026 is genuinely estimated** (scraper-derived, medium confidence).

---

## 1. What "viral for a niche" must mean (definition used throughout)

Raw view count alone fails a niche like auto parts — a 400K-view brake-job video from a 20K-follower channel is a far stronger signal than a 2M-view clip from a 15M-follower creator. The scoring model assumed in this report:

- **Absolute reach floor** per platform (e.g., TikTok ≥250K plays, YT long-form ≥100K, Shorts/Reels ≥500K — tunable per niche volume)
- **Relative overperformance:** views ÷ creator follower count (viral ≳ 5–10×)
- **Engagement rate:** (likes + comments + shares) ÷ views; ≥4–5% is strong
- **Velocity:** views ÷ days since publish (recency-weighted)
- **Niche relevance:** LLM-classified against the client's Brand DNA keywords (this is where Claude *does* belong in the pipeline — classification and rationale, not acquisition)

Confidence level per video = f(metric source: official API = high; scraper = medium-high; SERP snippet = low).

---

## 2. Method-by-method evaluation

Scale: ✅ yes · 🟡 partial/with caveats · ❌ no. The ten criteria: discover videos / obtain URLs / view counts / engagement / niche filter / recency filter / scale / cost / legal risk / reliability.

### 2.1 Claude native (WebSearch + WebFetch) — **probed live, fails as acquirer**
- Discover 🟡 (finds tag pages, creator names, occasional single videos) · URLs 🟡 · Views ❌ · Engagement ❌ · Niche ✅ · Recency ❌ (surfaced a June **2024** story for a "June 2026" query) · Scale ❌
- WebFetch is 403-blocked by TikTok, YouTube, Google, Apify (Appendix A). Metrics are unobtainable.
- **Role:** orchestration, query expansion, relevance classification, rationale writing — not acquisition. Legal risk: none. Cost: token-only.

### 2.2 Perplexity Sonar — same class of tool, same ceiling
- LLM-synthesized answers with citations; ~$1/1k requests + tokens. Sub-second ranked-results mode exists, but underlying indexes still don't carry per-video engagement metrics or true publish-window filtering for social video. Views/engagement ❌, recency 🟡, scale 🟡.
- **Role:** none that Claude's own WebSearch doesn't already cover. Skip.

### 2.3 Tavily — structured web search building blocks
- 1,000 free credits/mo; $30/10k. Returns URLs/snippets as JSON — good for agent plumbing, still no video metrics (❌) and weak social recency. Skip for this problem.

### 2.4 Google Search via SERP APIs (SerpAPI, Serper, DataForSEO)
- SerpAPI: free 250/mo; $25/1k → $275/30k searches. Has **YouTube Search API** (accepts YouTube's own `sp` filter params → upload-date filtering ✅) and Google Videos vertical.
- Discover ✅ · URLs ✅ · Views 🟡 (YouTube SERP shows approximate counts; no likes/comments) · Engagement ❌ · Niche ✅ · Recency ✅ · Scale ✅ · Legal 🟡 (scraping Google SERPs, vendor-shielded).
- **Role:** decent *supplementary* discovery net (catches videos Google ranks for niche terms), must be joined with a metrics source. Not a primary.

### 2.5 YouTube Data API v3 — **the only fully official, free, ToS-clean discovery API in this list**
- `search.list` with `q`, `publishedAfter`, `order=viewCount`, `regionCode=CA`, `relevanceLanguage=en`, `videoDuration`; then `videos.list part=statistics` (viewCount, likeCount, commentCount — 50 videos per call, 1 unit).
- All ten criteria ✅ except scale 🟡: **June 1 2026 quota change** put `search.list` in a dedicated bucket of ~100 calls/day/project (previously 100 units each from the 10k pool). 100 searches/day ≈ 10 niches × 10 query variants daily — fine for MVP; scale via quota-extension audit, multiple projects, or scraper fallback.
- Cost: $0. Legal: none (official). Reliability: highest of any method here.

### 2.6 YouTube scraping (yt-dlp, Apify `streamers/youtube-scraper`, `apidojo/youtube-scraper`)
- yt-dlp: free, keyless, returns views+likes+comments+upload date, supports search-filter URLs (`sp=CAMSBAgEEAE=` = sort:view-count, upload:this-month). Probe script included (`research/data/yt_probe.py`) — sandbox egress blocked it here; expected to work on open networks.
- Apify YouTube scrapers: ~$0.50/1k results, keyword search + date-from filters, view counts included.
- Violates YouTube ToS (automated access) → legal 🟡, reliability 🟡 (extractor breakage windows). **Role:** overflow/fallback when the official search bucket is exhausted.

### 2.7 TikTok official — dead end for commercial discovery
- **Research API:** academics/nonprofits in US/EEA/UK/CH only; "commercial users, creators, and advertisers are not eligible." ❌
- **Display API:** own-account content only. ❌
- **Creative Center / Creative Radar** (free, first-party): trending videos, hashtags, keyword insights, filterable by country (Canada) and industry ("Vehicle & Transportation"). No keyword-level organic search, metrics are coarse (rankings, not exact counts) — but it's a legitimate free *trend seed* source (and scrapable via Apify/RapidAPI wrappers). 🟡
- **Verdict:** official TikTok cannot produce the top-20 list. Commercial scrapers are the only realistic TikTok path — and TikTok is likely the highest-value platform for viral auto content.

### 2.8 TikTok commercial scraper APIs — **the core of the solution**
- **EnsembleData** (`ensembledata.com`): TikTok keyword-search endpoint documented with `name`, `period` (time filter), `sorting`, `country`, `match_exactly`, `get_author_stats`; returns `play_count`, `comment_count`, `share_count`, `collect_count`, `video_url`, hashtags, creator profile. Free 50 units/day; plans $100–$1,400/mo. All ten criteria ✅/✅/✅/✅/✅/✅/✅, cost moderate, legal 🟡 (vendor-shielded public scraping), reliability high (specialist, years in market).
- **ScrapeCreators** (`scrapecreators.com`): TikTok keyword + "Top" search, plus IG/YT/Reddit/FB in one API; $10 per 5k credits, 1k free; **official MCP server + Claude Code skill** — the natural fit for an agentic platform.
- **Apify** (`clockworks/tiktok-scraper`, `apidojo/tiktok-scraper`): $0.30–$1.00 per 1k posts, hashtag+keyword search, full metrics. Marketplace model = actor quality varies; pick per-result-priced actors.
- **Bright Data Social Scraper APIs:** $0.75/1k records PAYG (5k/mo free tier), 68 social endpoints, best-benchmarked success rate (~98%), strongest legal war chest (they *won* the Meta case). Enterprise-grade choice at higher integration effort.
- **Data365:** from $0.60/1k records, multi-platform.

### 2.9 Instagram official (Graph API) — challenge confirmed: **not a viable first provider**
- No public keyword search; hashtag search capped at **30 unique hashtags per 7 days** per account; business-account OAuth + app review required; and **2026: Meta removed view counts from third-party post/reel lookups**. Engagement ❌, scale ❌.
- Usable only for *the client's own* account analytics — irrelevant to discovery.

### 2.10 Instagram scrapers (Apify `apify/instagram-reel-scraper` $1.00/1k, hashtag scraper $1.90/1k; HikerAPI; Bright Data; ScrapeCreators)
- Hashtag/keyword reels with play counts, likes, comments via unofficial mobile/web endpoints behind vendor proxy networks. Works today; **most fragile of the big three** (Meta's 2026 API clampdown shows active hostility; scrapers periodically lose fields like view counts).
- Legal 🟡: logged-out public scraping is the fact pattern Bright Data won on, but Meta remains the most litigious platform. Use a vendor, never in-house logged-in scraping.
- **Verdict: phase-2 provider,** not MVP.

### 2.11 Reddit
- Official API: free tier is non-commercial (100 QPM); commercial access requires approval and is expensive (reported figures range from ~$12k/yr entry to $0.24/1k calls at volume — pricing is opaque and gated). Public JSON endpoints exist but commercial ToS applies.
- Reddit is a *signal amplifier*, not a video platform: `r/Justrolledintotheshop`, `r/MechanicAdvice`, `r/AutoDetailing` top-of-month posts reveal which clips broke out of the niche. Views/engagement of the underlying video ❌ (only Reddit score). **Nice-to-have enrichment, not required.**

### 2.12 Browser automation (Playwright/Puppeteer + accounts)
- Technically capable of everything; practically the worst option: TikTok/IG fingerprinting, CAPTCHAs, signed requests, behavioral detection; logged-in scraping is the exact fact pattern that *loses* in court (breach of contract) and burns accounts. High maintenance, low reliability, worst legal posture. **Rejected** except as a last-resort spot-checker. (Note: Chromium+Playwright are pre-installed in Claude cloud containers, so ad-hoc verification of individual public pages is cheap — but not bulk acquisition.)

### 2.13 MCP servers
- ScrapeCreators (official MCP + Claude skill), SociaVault MCP, SocialCrawl, Apify's MCP gateway to any actor. MCP adds zero acquisition capability beyond the underlying APIs — it's the **integration layer** that lets a Claude-based agent call them as tools. Use it, don't evaluate it as a source.

### 2.14 Buy-not-build check (any other realistic solution)
- SaaS trend platforms exist (ViralStat — cross-platform viral video tracking; vidIQ/OutlierKit for YouTube outliers; KOLSprite for TikTok). They prove market feasibility but are UI products with narrow/absent APIs and generic niche taxonomies — poor fit for an automated multi-client agency pipeline. Worth a 1-day evaluation of ViralStat's API during PoC, nothing more.

---

## 3. Comparison matrix

| Method | Discover | URLs | Views | Engagement | Niche filter | Recency filter | Scale | Cost | Legal risk | Reliability |
|---|---|---|---|---|---|---|---|---|---|---|
| Claude WebSearch/WebFetch | 🟡 | 🟡 | ❌ | ❌ | ✅ | ❌ | ❌ | tokens | none | low (probed) |
| Perplexity Sonar | 🟡 | 🟡 | ❌ | ❌ | ✅ | 🟡 | 🟡 | $1/1k req | none | low |
| Tavily | 🟡 | ✅ | ❌ | ❌ | ✅ | 🟡 | ✅ | $30/10k | none | low for this |
| SERP APIs (SerpAPI et al.) | ✅ | ✅ | 🟡 | ❌ | ✅ | ✅ | ✅ | $25–75/mo | low | medium |
| **YouTube Data API v3** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 100 srch/day | **$0** | **none** | **highest** |
| yt-dlp / Apify YT scrapers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | $0–0.50/1k | medium (YT ToS) | medium-high |
| TikTok Research API | ❌ commercial ineligible | — | — | — | — | — | — | — | — | — |
| TikTok Creative Center | 🟡 trends only | 🟡 | 🟡 coarse | 🟡 | 🟡 industry-level | ✅ | 🟡 | $0 | low | medium |
| **TikTok via EnsembleData / ScrapeCreators / Apify / Bright Data** | ✅ | ✅ | ✅ play_count | ✅ likes/comments/shares | ✅ keyword+hashtag | ✅ period param | ✅ | $0.30–2/1k | medium (vendor-shielded) | **high** |
| Instagram Graph API | ❌ | 🟡 | ❌ (removed 2026) | 🟡 | 🟡 30 tags/wk | 🟡 | ❌ | $0 | none | n/a for discovery |
| Instagram scrapers (Apify/HikerAPI/BD) | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ✅ | $1–2.60/1k | medium-high | **medium (most fragile)** |
| Reddit API/JSON | 🟡 signal | ✅ | ❌ | 🟡 score only | ✅ subreddits | ✅ | 🟡 | $0 gated / $$$ | low-medium | medium |
| Browser automation + accounts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | proxies+solvers | **highest** | **lowest** |
| MCP servers | (wrapper — inherits the wrapped API's scores) | | | | | | | | | |

---

## 4. Recommended architecture

Quality-first, three-stage pipeline. LLM at the edges, deterministic APIs in the middle.

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. QUERY EXPANSION (Claude)                                     │
│    Brand DNA → 15–25 niche terms/hashtags per client            │
│    "auto parts" → brake job, engine swap, OEM vs aftermarket,   │
│    mechanic fail, car restoration, #cartok, #mechanicsoftiktok  │
│    + TikTok Creative Center trend seeds (Vehicle & Transport/CA)│
├─────────────────────────────────────────────────────────────────┤
│ 2. PARALLEL HARVESTERS (deterministic, scheduled daily)         │
│    • TikTok: EnsembleData or ScrapeCreators keyword+hashtag     │
│      search (period=30d, country=CA where supported)            │
│    • YouTube: Data API search.list (publishedAfter, order=      │
│      viewCount, regionCode=CA) → videos.list statistics;        │
│      overflow → Apify YT scraper                                │
│    • Instagram (phase 2): Apify reel/hashtag scrapers           │
│    • Optional signals: Reddit auto subs top/month; SERP video   │
│      vertical                                                   │
│    → raw posts land in Postgres (dedupe on platform+video_id)   │
├─────────────────────────────────────────────────────────────────┤
│ 3. SCORING & RANKING                                            │
│    a. Hard gates: publish_date ≤ 30d, reach floor per platform  │
│    b. Virality score: relative overperformance × engagement     │
│       rate × velocity (weights tunable)                         │
│    c. Claude classification pass: niche relevance vs Brand DNA, │
│       locality boost (Toronto/Ontario/Canada cues), "why viral" │
│       rationale, confidence label (metric provenance)           │
│    → Top 20 per client per run                                  │
└─────────────────────────────────────────────────────────────────┘
```

Design decisions and the reasoning:
- **TikTok first, YouTube second, Instagram deferred** — inverted from the "Instagram-first" assumption, because TikTok has the best commercial data access and the richest viral auto-culture supply, while Instagram has the worst data access of the three.
- **Two independent metric sources minimum** (one official, one commercial) so vendor breakage degrades rather than kills the pipeline, and so metrics can be cross-audited.
- **Locality is a scoring boost, not a filter.** No platform reliably geo-tags viral organic video. Use country-level API params (CA), Toronto-flavored query variants, and creator-profile geo cues in the Claude pass. Set that expectation with the agency now.
- **Claude never invents numbers.** Every metric in the output must carry provenance (which API, fetched when). LLM roles: query expansion, relevance classification, rationale, confidence labeling.

## 5. Recommended MVP

One client (SPH Auto Parts), two platforms, one daily cron:

1. **TikTok via ScrapeCreators** (start: $10/5k credits, free 1k to trial; official MCP server/Claude skill; swap-target: EnsembleData if coverage disappoints) — ~15 keyword/hashtag searches/day.
2. **YouTube via Data API v3** (free) — ~10 `search.list` calls/day + batched `videos.list`.
3. Postgres (Supabase — already in your stack) with one `videos` table; nightly job; scoring in plain TypeScript; single Claude call to classify+annotate the ~100 gated candidates; output = ranked top-20 JSON/report.
4. Explicitly out of MVP: Instagram, Reddit, SERP net, dashboards.

MVP running cost: **≈ $20–60/month + LLM tokens** for one client; marginal cost per additional client niche ≈ $10–30/month.

## 6. Recommended technology stack

| Layer | Choice | Why |
|---|---|---|
| Harvesters | TypeScript (Node) workers or Supabase Edge Functions + `pg_cron` | matches existing platform; scheduled fetches are trivial |
| TikTok data | ScrapeCreators (MVP) / EnsembleData (scale) | keyword search + period filter + full metrics; MCP-native |
| YouTube data | Official Data API v3; Apify `streamers/youtube-scraper` as overflow | free, legal, highest reliability |
| Instagram data (phase 2) | Apify reel/hashtag scrapers or Bright Data | vendor-shielded; budget for breakage |
| Storage | Postgres (Supabase) | dedupe, history, velocity computation needs snapshots |
| Scoring/annotation | Claude (Sonnet-class for classification; batch API) | cheap, deterministic prompts, structured output |
| Agent integration | MCP (ScrapeCreators MCP, Apify MCP) | lets the platform's agents call harvesters as tools later |
| Monitoring | per-source success-rate + field-completeness alarms | scraper breakage is *when*, not *if* |

## 7. Risks

1. **Scraper breakage / field loss** (Instagram highest, TikTok medium, YouTube-official none). Mitigation: two-vendor strategy, provenance-tagged metrics, completeness monitors, budget assumption that any single vendor is down ~a few days/year.
2. **Platform ToS / legal.** Public logged-out scraping via vendors sits on favorable US precedent (Meta v. Bright Data 2024; hiQ CFAA line), but ToS breach claims remain possible; YouTube scraping specifically violates YouTube ToS (use the official API as primary). Canada: PIPEDA — store post-level public metrics, not personal-data dossiers; honor deletion of source content on refresh.
3. **YouTube search quota ceiling** (100 searches/day/project since June 2026). Fine to ~10 niches/project; beyond that: quota extension audit, project sharding, or scraper overflow — plan before onboarding client #10.
4. **Metric honesty:** TikTok hides exact view counts in some surfaces; scraper `play_count` is real but point-in-time; Instagram views post-2026 are partially estimated. The "Estimated views" column must carry confidence labels or the agency will over-trust it.
5. **Niche supply risk:** "auto parts retail" (narrow) vs "auto/mechanic culture" (huge). Some 30-day windows may not contain 20 genuinely viral *parts-specific* videos in Canada — the system should widen concentric niche rings (parts → repair → car culture) and say so, rather than pad the list.
6. **Reddit commercial licensing** is gated and expensive — treat Reddit as optional enrichment only, or drop it.
7. **Vendor lock-in / pricing drift** in the scraper market (prices moved significantly 2024→2026). Keep the harvester interface vendor-agnostic (one `RawVideo` schema, adapters per vendor).

## 8. Unknowns (only resolvable with paid trials / open network)

1. Real-world **precision and coverage** of TikTok keyword search per vendor for this niche in Canada (does `country=CA` bias results usefully? how exact is `period` filtering?).
2. **Metric accuracy deltas**: scraper counts vs on-platform displayed counts (spot-check sample needed).
3. Whether Instagram scrapers currently return reel play counts reliably post-Meta-2026 changes — decides if Instagram phase 2 is viable at all.
4. YouTube **quota extension** turnaround/approval odds for a marketing-agency use case.
5. Actual 30-day *viral supply volume* for "automotive parts" (vs adjacent rings) — determines the reach-floor calibration.
6. This sandbox blocked all direct platform egress (see probe log), so yt-dlp/Reddit-JSON behavior was not empirically confirmed here — first hour of the PoC re-runs `research/data/yt_probe.py` on an open network.
7. ViralStat (or similar SaaS) API fitness — cheap 1-day check before building harvesters.

## 9. Suggested Proof of Concept

**Goal:** produce the actual SPH Auto Parts top-20 list three runs in a row, and measure it.
**Duration:** 2 weeks. **Budget:** ≤ $150 (ScrapeCreators $10–20 + Apify $5 free credit + optional EnsembleData free tier + tokens). **Environment:** any machine/VM with open egress.

Week 1 — acquisition validation:
1. Run `research/data/yt_probe.py` (yt-dlp) → immediate free evidence YouTube discovery works; then repeat via official Data API key (30 min setup) and compare.
2. ScrapeCreators trial: 12 TikTok keyword/hashtag queries (from a Claude-generated term set), period ≈ 30 days; log field completeness (play/like/comment/share/date present?).
3. Spot-check 20 videos by hand in a browser: scraper metric vs displayed metric (accuracy delta).
4. 1-day sanity check of EnsembleData free tier (coverage comparison) and ViralStat.

Week 2 — end-to-end dry run:
5. Load everything into one Postgres table; apply gates + virality score; single Claude pass for relevance/rationale/confidence; emit top-20.
6. Have a human marketer grade the list: % genuinely viral, % niche-relevant, % ≤30 days. **Acceptance: ≥80% recency-correct, ≥70% niche-relevant, ≥15 of 20 defensibly "viral," metric deltas ≤15% median.**
7. Re-run on days 10 and 14 — measure churn and pipeline breakage. Decide Instagram phase 2 based on finding #3 above.

If step 6 passes, the core question is answered affirmatively with production-shaped evidence, and the harvester adapters written for the PoC are the seed of the real system.

---

## Appendix A — Live probe evidence

See `research/data/probe-log.md` for the full log. Summary: the sandboxed research container's egress policy blocked *all* direct platform access (yt-dlp → 0 results, Reddit JSON → proxy 403; environment constraint, not platform behavior). Claude-native WebSearch, probed as a discovery engine on this exact test case, returned tag/discover pages and a **2024** news story with the only concrete view count seen; it produced no fresh ranked list and no metrics. Claude-native WebFetch was 403-blocked by TikTok, YouTube, Google, and Apify. This is the empirical basis for scoring LLM-native tools "discovery: partial, metrics: zero."

## Appendix B — Key sources

- YouTube quota & June 2026 search bucket: [Google quota calculator](https://developers.google.com/youtube/v3/determine_quota_cost), [SocialCrawl: YouTube Data API in 2026](https://www.socialcrawl.dev/blog/youtube-data-api-2026), [OutlierKit: YouTube API quota](https://outlierkit.com/resources/youtube-api-quota/), [getphyllo quota guide](https://www.getphyllo.com/post/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota)
- TikTok Research API eligibility: [developers.tiktok.com/products/research-api](https://developers.tiktok.com/products/research-api/), [Research API FAQ](https://developers.tiktok.com/doc/research-api-faq)
- TikTok Creative Center: [ads.tiktok.com Keyword Insights](https://ads.tiktok.com/help/article/keyword-insights), [Stackmatix 2026 guide](https://www.stackmatix.com/blog/tiktok-creative-center-guide)
- Instagram Graph API limits & 2026 view-count removal: [Meta IG Hashtag Search docs](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-hashtag-search/), [Emplifi hashtag FAQ](https://docs.emplifi.io/platform/latest/home/instagram-hashtag-limitation-faq), [SociaVault: Instagram API deprecated again?](https://sociavault.com/blog/instagram-api-deprecated-alternative-2026), [Netrows IG data APIs 2026](https://www.netrows.com/blog/best-instagram-data-apis-2026)
- EnsembleData TikTok keyword search: [ensembledata.com/tiktok-api](https://ensembledata.com/tiktok-api), [keyword search blog](https://ensembledata.com/blog/tiktok-scraper-keyword-search-api), [pricing](https://ensembledata.com/pricing)
- ScrapeCreators: [scrapecreators.com](https://scrapecreators.com/), [TikTok Top Search docs](https://docs.scrapecreators.com/v1/tiktok/search/top)
- Apify actors & pricing: [clockworks/tiktok-scraper](https://apify.com/clockworks/tiktok-scraper), [apidojo/tiktok-scraper](https://apify.com/apidojo/tiktok-scraper), [apify/instagram-reel-scraper](https://apify.com/apify/instagram-reel-scraper), [streamers/youtube-scraper](https://apify.com/streamers/youtube-scraper), [Use-Apify pricing roundups](https://use-apify.com/docs/best-apify-actors/best-instagram-scrapers)
- Bright Data: [Social Media Scraper](https://brightdata.com/products/web-scraper/social-media-scrape), [docs: social media APIs](https://docs.brightdata.com/api-reference/scrapers/social-media-apis/overview), [AIMultiple benchmark](https://aimultiple.com/social-media-scraping)
- Data365: [pricing](https://data365.co/pricing) · SerpAPI: [pricing](https://serpapi.com/pricing), [YouTube Search API](https://serpapi.com/youtube-search-api)
- Perplexity/Tavily: [Perplexity pricing docs](https://docs.perplexity.ai/docs/getting-started/pricing), [alphacorp Sonar vs Tavily 2026](https://alphacorp.ai/blog/perplexity-search-api-vs-tavily-for-rag-2026)
- Reddit API commercial terms: [Reddit Help: Developer Platform](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data), [Octolens Reddit API pricing](https://octolens.com/blog/reddit-api-pricing)
- Legal: [Farella Braun: Meta v. Bright Data](https://www.fbm.com/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/), [Farella Braun: hiQ v. LinkedIn](https://www.fbm.com/publications/what-recent-rulings-in-hiq-v-linkedin-and-other-cases-say-about-the-legality-of-data-scraping/), [SocialCrawl legal & technical primer](https://www.socialcrawl.dev/blog/social-media-scraping-legal-technical-guide)
- Anti-bot / browser automation: [Scrapfly: scraping TikTok 2026](https://scrapfly.io/blog/posts/how-to-scrape-tiktok-python-json), [Decodo TikTok guide](https://decodo.com/blog/scrape-tiktok)
- MCP landscape: [Socialync: best social MCP servers 2026](https://www.socialync.io/blog/best-social-media-mcp-servers-2026)
- SaaS check: [ViralStat](https://viralstat.com/)
