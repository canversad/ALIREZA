# Product Design: AI-Assisted Content Research Workflow

**Date:** 2026-07-04
**Scope:** Product workflow and UX only. No architecture changes; Knowledge Base and Brand DNA are used as they exist today. Follows the feasibility findings in `research/viral-video-discovery.md`.
**Design frame:** a content strategist at a marketing agency, preparing for a content production meeting with a client.

---

## 0. The one idea that holds this design together

Everything in both creative paths produces the same object: an **Opportunity** — a single card that says *"here is a piece of content this client should make, and here is the evidence."* Opportunities differ only in where their evidence comes from:

- **Path A (trend-driven):** the evidence is a real viral video and its metrics.
- **Path B (original):** the evidence is grounding — a Brand DNA trait, a past winning post, a customer interest, a local event, a seasonal moment, or a business goal.

One object, one lifecycle, one approval chain, one hand-off into the Content Planner. The strategist never learns two systems.

```
                    THE OPPORTUNITY LIFECYCLE

 Path A: Trend Radar ──┐
                       ├──► DISCOVERED ──► SHORTLISTED ──► ANALYZED ──► BRIEFED
 Path B: Idea Studio ──┘        │               │             │           │
                                ▼               ▼             ▼           ▼
                            (ignored,       REJECTED      REJECTED    APPROVED ──► PITCHED ──► PLANNED
                             expires)      + reason      + reason    (internal)   (client)   (in Planner)
```

Rejections are first-class: every rejection carries a reason, and reasons are remembered. The system gets smarter about this client with every "no."

---

## 1. Persona and scenario

**Maya**, content strategist. Eight clients. Thursday at 2pm she has a production meeting with **SPH Auto Parts** (automotive parts, Toronto). She needs to walk in with 6–10 content proposals the client can react to: some riding proven trends, some original to the brand. Today she does this with four browser tabs, a TikTok doomscroll, and a Google Doc. Her pain is not "I can't find videos" — it's *"I can't prove why this one matters, I can't remember what the client already rejected, and packaging it all takes longer than finding it."*

Design targets derived from that pain:

1. **Zero cold starts.** The system researches while Maya sleeps; she curates, she doesn't hunt.
2. **Every claim carries evidence.** Numbers with provenance, ideas with grounding. Maya presents to a skeptical business owner.
3. **Memory.** What was pitched, approved, rejected — and why — is never lost (Knowledge Base).
4. **The meeting is the finish line.** The workflow's output is literally the meeting agenda.

---

## 2. User journey — the week before the meeting

| Day | Activity | Screen | Time |
|---|---|---|---|
| Continuous (nightly) | System harvests + scores niche videos for every active client; refreshes trend/seasonal signals | — (background) | 0 min of Maya's |
| Monday | Maya opens SPH's **Research Hub**: "23 new opportunities since last week, 4 hot." Skims **Trend Radar**, shortlists 6 videos in ~15 min. Pops into **Idea Studio**, generates a batch of original ideas, stars 4. | Hub → Radar → Studio | 30 min |
| Tuesday | Opens each shortlisted item, hits **Analyze** on the keepers. Reads the AI's "why it worked / how SPH does it" takes, discards 3, edits and approves 7 **Briefs**. | Opportunity Detail → Brief Editor | 45 min |
| Wednesday | Opens **Meeting Prep**, drags 7 approved briefs into a pitch order, adds talking points, previews the client-facing view. | Meeting Mode | 20 min |
| Thursday 2pm | Runs the meeting from **Meeting Mode** on a shared screen: plays reference videos, shows evidence chips, captures the client's verdict on each card live (approve / reject+reason / revise). | Meeting Mode (presenting) | the meeting |
| Thursday 3pm | Approved cards are sitting in the **Content Planner** as unscheduled drafts. Maya drags them onto calendar dates. Rejections + reasons are already in the Knowledge Base. | Content Planner | 10 min |

Total strategist time to a client-ready, evidence-backed content slate: **≈ 2 hours.** The system spent its own hours overnight.

---

## 3. Screen-by-screen workflow

### Screen 1 — Research Hub (the first screen)

**Answers Q1 and Q2.** The first screen is *not* a search box and *not* a global feed. It is the client's research home. The first thing the user selects is the **client** (which silently loads Brand DNA, KB history, niche profile); the second is the **purpose** of the session.

```
┌────────────────────────────────────────────────────────────────────┐
│  SPH Auto Parts ▾                     Next meeting: Thu 2pm  [Prep]│
├────────────────────────────────────────────────────────────────────┤
│  Since your last visit (Mon):                                      │
│  ● 23 new trend opportunities · 4 marked HOT (rising fast)         │
│  ● 2 local signals: "Canada Day car meets", "July road-trip prep"  │
│  ● Last post's performance is in: +38% vs. account average         │
├──────────────────────┬──────────────────────┬──────────────────────┤
│   📡 TREND RADAR     │   💡 IDEA STUDIO     │   🗂 MEETING PREP     │
│   Ride what's        │   Create what's      │   Package this        │
│   already working    │   uniquely yours     │   week's pitch        │
│   23 new · 4 hot     │   6 grounding        │   7 briefs approved   │
│                      │   sources fresh      │   0 scheduled         │
└──────────────────────┴──────────────────────┴──────────────────────┘
│  Pipeline: 6 shortlisted · 3 analyzed · 7 briefed · 12 in KB       │
└────────────────────────────────────────────────────────────────────┘
```

- **Required data in:** client id → Brand DNA summary, niche keyword set, harvest deltas since last visit, pipeline counts, next meeting date (from planner), latest performance link-backs.
- **User actions:** pick a mode; jump straight into pipeline stages.
- **AI actions:** compose the "since your last visit" digest (one cheap summarization pass over deltas).
- **Empty state (new client):** the Hub becomes a 5-minute **Niche Setup wizard**: AI proposes the keyword/hashtag universe from Brand DNA ("brake repair, #cartok, OEM vs aftermarket…"), Maya edits and confirms. This human-approved keyword universe is the single most important quality lever in the whole product — discovery quality is decided here, so it is a deliberate, editable, revisitable artifact (stored in KB), not a hidden config.

---

### Screen 2 — Trend Radar (Path A: discovery feed)

**Answers Q3 and Q4.** Discovery is **push, not pull**: the nightly pipeline (per the research: TikTok + YouTube commercial/official APIs) has already harvested, deduped, scored and ranked. Maya reviews a curated feed; she can steer it, but she never starts from a blank query.

```
┌────────────────────────────────────────────────────────────────────┐
│ Trend Radar · SPH Auto Parts        [All ▾] [TikTok ✓] [YouTube ✓] │
│ Sort: Opportunity ▾ · Window: 30d ▾ · ☐ Hide seen  🔍 hunt manually │
├────────────────────────────────────────────────────────────────────┤
│ ┌───────────┐  "POV: the part your mechanic says you need…"       │
│ │ ▶ thumb   │  @torquetok · TikTok · 4 days ago                    │
│ │           │  2.1M plays · 9.4% eng · 42× creator baseline        │
│ │  0:34     │  ⚡ Rising fast   🎯 Brand fit: high   🔧 Easy to adapt│
│ └───────────┘  Why here: humor format + parts-counter setting      │
│                [Shortlist ★]  [Watch]  [Not for us ▾]              │
├────────────────────────────────────────────────────────────────────┤
│ ┌───────────┐  "Brake pads: cheap vs OEM — 60k km later"          │
│ │ ▶ thumb   │  Dylan's Diag · YouTube Shorts · 11 days ago         │
│ …                                                                  │
└────────────────────────────────────────────────────────────────────┘
```

**Ranking (Q4): the Opportunity Score.** Never a bare virality chart. Four visible components, each rendered as a plain-language chip, no black-box number without a "why":

1. **Virality** — relative overperformance (views ÷ creator baseline) + engagement rate + velocity. A 400K video from a small shop outranks a 2M video from a 15M-follower creator.
2. **Brand fit** — cheap LLM match against Brand DNA (tone, audience, product lines). A drift-crash compilation can be maximally viral and rank low for a parts retailer.
3. **Adaptability** — can *this* client plausibly produce it? (format complexity, cast, location, gear). "Talking-head at the counter" beats "cinematic engine build timelapse" for most clients.
4. **Freshness & locality boost** — recency decay + Toronto/Ontario/Canada cues (per research: locality is a boost, never a hard filter).

Feed controls: platform, time window, format, "hide seen," and per-card **"Not for us ▾"** with one-tap reasons (*off-brand / can't produce / seen it / wrong audience*) that immediately tune future ranking. The manual 🔍 hunt (keyword search on demand) exists for meeting-day requests, but it's deliberately secondary.

- **Required data per card (Q5 — the video information contract):** thumbnail + tappable inline player (embedded/oEmbed, never re-hosted), title/hook line, creator + follower count, platform, publish date ("4 days ago"), plays/views, likes, comments, shares, engagement rate, overperformance multiple, the four score chips, one-line "why here," metric provenance + confidence badge (official API = solid badge; scraper = "est." badge — honesty from the research findings), and pipeline state if already touched (shortlisted/analyzed/pitched *or previously rejected — with the old reason*, so nothing is re-pitched by accident).
- **AI actions here:** scoring only (already done at harvest). **No deep analysis yet** — see Q7.
- **Failure states:** a harvest source down → banner "TikTok data is 2 days old (provider issue)" — never silently stale. Thin week in the narrow niche → radar widens to concentric rings (parts → repair → car culture) and *labels* the ring on each card rather than padding silently.

---

### Screen 3 — Opportunity Detail (after selecting a video)

**Answers Q6 and Q7.** Clicking a card opens the detail view. **Selecting is not analyzing.** The detail shows everything already known (full metrics, creator context, comment themes if harvested, similar past opportunities from KB). The expensive step is an explicit button:

```
┌────────────────────────────────────────────────────────────────────┐
│ ◀ Back to Radar                          State: SHORTLISTED ★      │
├──────────────────────┬─────────────────────────────────────────────┤
│  ▶ inline player     │ @torquetok · 88K followers · TikTok         │
│                      │ Published Jun 30 (4 days ago)               │
│                      │ 2.1M plays (est.) · 196K likes · 8.1K cmts  │
│                      │ 12.4K shares · 9.4% engagement · 42× base   │
│                      │ Provenance: ScrapeCreators, fetched 03:12   │
├──────────────────────┴─────────────────────────────────────────────┤
│ [✨ Analyze for SPH]        [Brief it →]   [Reject ▾]   [Share 🔗] │
├────────────────────────────────────────────────────────────────────┤
│ ── AI Analysis (after "Analyze") ─────────────────────────────────  │
│ WHY IT WENT VIRAL   relatable fear ("am I being upsold?") + insider│
│                     authority + 3-second visual hook at the counter│
│ THE TRANSFERABLE    "staff debunks a customer myth on camera" —    │
│ PATTERN             works for any parts counter                    │
│ HOW SPH DOES IT     3 angles, each tagged with the Brand DNA trait │
│                     it expresses and est. production effort        │
│ WATCH OUT           don't mock customers (Brand DNA: "ally, not    │
│                     expert-splaining"); music license on original  │
│ VERDICT             Strong adapt · Confidence: high                │
└────────────────────────────────────────────────────────────────────┘
```

**Q7 — when AI analysis happens:** two tiers, strictly.

- **Tier 1 (automatic, cheap, at harvest):** scoring, brand-fit classification, one-line "why here." Runs on everything.
- **Tier 2 (on demand, expensive, human-triggered):** the deep read above — only when Maya clicks **Analyze** on something she has already judged worth her attention. This keeps cost proportional to human interest, keeps the feed fast, and keeps the AI from generating thousands of unread essays. Analysis is cached with the opportunity forever after.

**Q6 — what happens after selecting:** the card's state advances (SHORTLISTED), it appears in the Hub pipeline, and three exits open: *Analyze* (Tier 2), *Brief it* (→ Screen 5), or *Reject with reason*. Nothing else happens automatically.

---

### Screen 4 — Idea Studio (Path B: original ideas)

Same grammar as the Radar — a feed of cards to curate — but the cards are **generated, grounded ideas** instead of harvested videos.

```
┌────────────────────────────────────────────────────────────────────┐
│ Idea Studio · SPH Auto Parts                                       │
│ Ground in: [Brand DNA ✓] [Past winners ✓] [Customer interests ✓]   │
│            [Local events ✓] [Seasonal ✓] [Business goals ✓]        │
│ Direction (optional): "client wants more DIY-friendly content"     │
│                                        [⟳ Generate 10 ideas]       │
├────────────────────────────────────────────────────────────────────┤
│ 💡 "The $40 fix dealers charge $400 for" — monthly series          │
│    Grounded in: 🧬 Brand DNA "honest ally" · 🏆 your top post of   │
│    May (+212%) was a savings reveal · 🎯 goal: DIY segment growth  │
│    Format: 45s counter demo · Effort: low · [★ Keep] [Reject ▾]    │
├────────────────────────────────────────────────────────────────────┤
│ 💡 "Road-trip ready in 15 minutes" — Canada Day weekend special    │
│    Grounded in: 📅 seasonal (July long weekend) · 📍 local: Hwy    │
│    400 cottage traffic · 🧬 "neighbourhood expert"                 │
│    Format: checklist reel · Effort: low · [★ Keep] [Reject ▾]      │
└────────────────────────────────────────────────────────────────────┘
```

The rule that makes this credible: **no ungrounded ideas.** Every card must cite at least one concrete grounding chip from the six sources (Brand DNA · previous successful content from KB · customer interests · local events · seasonal trends · business goals). A chip is tappable and shows its evidence (the actual past post, the actual event listing). If the AI can't ground a concept, it doesn't show it. This is the difference between "ChatGPT brainstorm" and agency-grade ideation — and it's what makes the client meeting defensible.

- **Required data in:** Brand DNA (read-only), KB retrieval (past posts + performance, past rejections + reasons — *never regenerate something the client already killed; if a rejected theme resurfaces deliberately, the card says "client rejected similar in May because X — this differs by Y"*), customer-interest notes from KB, a local-events feed (city-scoped), seasonal calendar, business goals for the quarter, plus Maya's optional free-text direction.
- **User actions:** toggle grounding sources, add direction, generate batch, ★ keep / reject-with-reason per card, "more like this one."
- **AI actions:** batch generation (Tier 2 cost, but user-triggered by nature) — cards are cheap sketches, not full briefs.
- Kept ideas become **Opportunities (source: original)** — from here on, Path B is literally the same pipeline: detail view → Brief → approval → Meeting Mode → Planner. **This is the convergence.**

---

### Screen 5 — Brief Editor (both paths converge here)

The bridge from research to production. One page, AI-drafted, human-owned:

```
┌────────────────────────────────────────────────────────────────────┐
│ Brief: "Myth-bust at the counter"          source: 📡 trend-adapted│
│ Reference: @torquetok video (2.1M) — pinned, with analysis         │
├────────────────────────────────────────────────────────────────────┤
│ CONCEPT (2 sentences, editable)                                    │
│ WHY THIS, WHY NOW (auto-composed from evidence — editable)         │
│ SUGGESTED FORMAT   platform · length · setting · cast              │
│ BRAND ALIGNMENT    which Brand DNA traits this expresses           │
│ PRODUCTION NOTES   effort estimate · props · location · risks      │
│ SUCCESS CRITERIA   what "worked" will mean (reach vs. saves vs.    │
│                    store visits — tied to business goal)           │
├────────────────────────────────────────────────────────────────────┤
│ [Save draft]      [✓ Approve brief]      [Discard ▾ reason]        │
└────────────────────────────────────────────────────────────────────┘
```

Explicitly **not** in the brief: scripts, hooks, shot lists, captions. That is production work that happens *after* the client says yes (and per the sprint instructions, out of scope here). The brief is a pitchable promise, not a deliverable.

**Approve brief** = human approval point #2 (the editorial gate). Approved briefs appear in Meeting Prep.

---

### Screen 6 — Meeting Mode (the finish line)

Two faces, one screen:

**Prep face (Maya, Wednesday):** drag approved briefs into pitch order, group into themes ("Trend rides" / "Original to SPH" / "Seasonal now-or-never"), attach talking points, toggle what the client sees (internal effort estimates and provenance details can be hidden), preview.

**Presenting face (Thursday, shared screen):** one card at a time, clean and client-facing — reference video plays inline, evidence chips large ("2.1M plays," "your May post did +212% on this theme," "42× this creator's normal"), concept in two sentences. Under each card, three live buttons:

```
        [ ✓ Client approved ]   [ ✎ Revise: note ]   [ ✗ Passed: reason ▾ ]
```

Maya captures the verdict *in the meeting, on the card*. No post-meeting transcription, no lost context. This is human approval point #3 — the client's — and it is the only gate that moves anything toward publication.

- **Required data:** approved briefs + their evidence bundles; client-safe rendering rules; meeting metadata (date, attendees).
- **AI actions:** none during the meeting. (Optional post-meeting: summarize verdicts into a recap note saved to KB / emailable to the client.)

---

### Screen 7 — Content Planner hand-off (Q10)

No new planner is designed — the existing Content Planner receives the output. The contract:

- On **client approval**, the Opportunity lands in the Planner as an **unscheduled draft card** carrying: title, brief, source type (trend/original), the full evidence bundle (reference video link + metrics snapshot, or grounding chips), suggested platform/format, any client notes from the meeting, and a link back to its research trail.
- Maya (or the producer) **drags it onto a date** — scheduling remains a human act in the planner, where it lives today. Seasonal/event-grounded cards carry a *suggested window* ("before Jul 1") the planner surfaces as a gentle deadline hint.
- **Revise** verdicts return the card to the Brief Editor with the client's note attached.
- After publication, the planner's performance data links back to the originating Opportunity in the KB — closing the loop that makes next month's Idea Studio smarter ("your trend-adapted posts outperform originals 2:1 on reach; originals win on saves").

---

## 4. The ten questions, answered in one place

1. **First screen?** The client-scoped **Research Hub**: a "since you last looked" digest plus three doors (Trend Radar / Idea Studio / Meeting Prep) and the live pipeline. Never a blank search box.
2. **First selection?** The **client** (loads Brand DNA + KB context implicitly), then the **session purpose** (one of the three doors).
3. **How does discovery work?** Continuous background harvesting per client niche (nightly, from the validated TikTok+YouTube pipeline), pre-scored and deduped; the strategist curates a ranked feed. Manual keyword hunts exist but are the exception. Discovery quality is governed by the human-approved **keyword universe** created in the niche-setup wizard and stored in the KB.
4. **How are opportunities ranked?** By transparent **Opportunity Score** = virality (relative overperformance, engagement, velocity) × brand fit × adaptability × freshness/locality boost — each component shown as a plain-language chip with a "why," and continuously tuned by reject-reasons.
5. **What's shown per video?** Player/thumbnail, hook line, creator + baseline, platform, publish date, plays, likes, comments, shares, engagement rate, overperformance multiple, four score chips, one-line "why here," **metric provenance + confidence badge**, and prior pipeline history with this client (including past rejection reasons).
6. **After selecting a video?** State advances to Shortlisted; the detail view opens with full evidence; three explicit exits — Analyze, Brief it, Reject with reason. Nothing automatic.
7. **When does AI analysis happen?** Two tiers: cheap automatic scoring/classification at harvest (everything); deep analysis (why-it-worked, transferable pattern, client-specific angles, risks) **only on explicit human request** for shortlisted items. Cost follows attention; analysis is cached forever after.
8. **What goes to the Knowledge Base?** Decisions and distillations, not dumps: approved opportunities with their briefs + analysis + evidence snapshot; rejections with reasons (client-level taste memory); the niche keyword universe; meeting recaps and verdicts; post-publication performance link-backs. **Not** stored in KB: the raw nightly harvest (operational data, expires). Brand DNA is **read-only** to this workflow.
9. **What requires human approval?** Three gates, AI approves nothing: **(1) Shortlist** — a human judges relevance before any expensive AI runs; **(2) Brief approval** — a human owns every word before it can be pitched; **(3) Client approval in Meeting Mode** — the only gate that moves content toward production. Additionally, the niche keyword universe (setup and edits) is human-confirmed.
10. **How do approved opportunities flow into the Content Planner?** As unscheduled draft cards carrying their full evidence bundle and suggested timing window; a human drags them onto dates in the existing planner; "revise" verdicts loop back to the Brief Editor; published performance links back to the source Opportunity.

---

## 5. Decision points and approval points

### Decision points (where the flow branches)

| # | Where | Decision | Made by | Consequence |
|---|---|---|---|---|
| D1 | Niche setup | Keyword universe scope | Strategist (AI-proposed) | Governs all future discovery quality |
| D2 | Trend Radar | Shortlist / ignore / reject+reason | Strategist | Reject-reasons retune ranking; ignored cards expire naturally |
| D3 | Opportunity Detail | Analyze or not | Strategist | Controls AI spend; gates Tier-2 |
| D4 | Post-analysis | Brief it / reject | Strategist | "Strong adapt" verdicts are advice, never auto-briefed |
| D5 | Idea Studio | Grounding sources + direction; keep/reject per idea | Strategist | Shapes generation; keeps convert to Opportunities |
| D6 | Brief Editor | Approve / keep drafting / discard | Strategist | Approval exposes it to Meeting Prep |
| D7 | Meeting Prep | Which briefs enter the pitch, in what order, client-safe visibility | Strategist | The meeting agenda |
| D8 | Meeting Mode | Approve / revise / pass per card | **Client** | Approve → Planner; revise → Brief Editor; pass → KB memory |
| D9 | Content Planner | Schedule date | Strategist/producer | Unchanged from today's planner behavior |

### Human approval gates (hard gates — AI cannot pass them)

| Gate | Who | What it protects |
|---|---|---|
| A1 Shortlist | Strategist | Attention & cost — no deep AI on unjudged content |
| A2 Brief approval | Strategist | Editorial quality & brand safety — a human owns every pitched word |
| A3 Client approval (Meeting Mode) | Client | The client relationship — nothing enters the production pipeline without an explicit client yes, captured with provenance |

---

## 6. Knowledge Base contract (kept architecture, defined traffic)

| Direction | Content |
|---|---|
| **Read** | Brand DNA (traits, tone, audience, product lines) · past content + performance · customer-interest notes · prior opportunity decisions (approved/rejected + reasons) · niche keyword universe |
| **Write** | Approved Opportunities (brief + analysis + evidence snapshot + outcome) · rejections with reasons (strategist-level and client-level, kept distinct) · niche keyword universe and its edits · meeting recaps with per-card verdicts · post-publication performance link-backs |
| **Never** | Raw harvest feeds (operational, expiring) · downloaded/re-hosted video files (links + metric snapshots only — legal posture from the research) · any Brand DNA mutation |

---

## 7. Final recommendation

**Build the spine first, in lifecycle order, one client live from day one:**

1. **Trend Radar + Opportunity Detail** (Path A feed with real harvested data — it's the wow moment and it exercises the validated pipeline; Tier-2 Analyze included).
2. **Brief Editor + Planner hand-off** (the value only becomes real when an opportunity lands in the planner; ship the loop before widening it).
3. **Meeting Mode** (this is the differentiator vs. every trend tool on the market — no competitor closes the loop *inside the client meeting*; ViralStat and vidIQ end at the feed).
4. **Idea Studio last** (it depends on KB retrieval quality and reject-reason memory accumulated by 1–3; grounded generation is only as good as the grounding it can cite).

**Validate with two real strategists before styling anything:** (a) does the Opportunity Score ordering match their gut on 20 real cards? (fix weights before UI polish); (b) can they get from Hub to a 7-brief meeting pack in under two hours? (the journey's core promise); (c) in a mock client meeting, do the evidence chips actually land? — that's the product's reason to exist.

**Two disciplines to hold onto as this gets built:** every number visible to a client carries provenance and a confidence badge (trust, once lost in a client meeting, is unrecoverable), and every AI output in the flow is a *proposal* that a named human either adopted, edited, or rejected — the audit trail is the agency's professional cover, and the reject-reasons are the moat.
