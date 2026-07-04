/**
 * Runtime validation for the Research Hub (Iteration 1).
 *
 * Asserts the hub renders values traceable to the SQLite store (not hardcoded):
 * reads expected counts from the DB with node:sqlite, then compares against
 * the DOM rendered by the running dev/prod server. Captures screenshots.
 *
 * Usage: BASE_URL=http://localhost:3100 node scripts/validate-runtime.mjs
 */
import { chromium } from "playwright-core";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3100";
const DB_PATH = process.env.CI_DB_PATH ?? path.join(process.cwd(), "var", "poc.db");
const OUT_DIR = process.env.SHOT_DIR ?? path.join(process.cwd(), "var", "screenshots");
const EXECUTABLE = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

const failures = [];
const check = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures.push(name);
};

// --- Expected values straight from the store ---
const db = new DatabaseSync(DB_PATH);
const clientId = "sph-auto-parts";
const total = db.prepare("SELECT COUNT(*) n FROM opportunities WHERE client_id = ?").get(clientId).n;
const hot = db
  .prepare(
    "SELECT COUNT(*) n FROM opportunities WHERE client_id = ? AND state = 'discovered' AND json_extract(score_json, '$.hot') = 1",
  )
  .get(clientId).n;
const sinceIso = new Date(Date.now() - 7 * 86_400_000).toISOString();
const newCount = db
  .prepare("SELECT COUNT(*) n FROM opportunities WHERE client_id = ? AND created_at >= ?")
  .get(clientId, sinceIso).n;
console.log(`DB expectations: total=${total} new(7d)=${newCount} hot=${hot}`);
check("seeded store is non-empty", total > 0, `total=${total}`);

// --- Drive the real UI ---
mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ executablePath: EXECUTABLE });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Root redirects to the client hub
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  check("root redirects to client hub", page.url().includes(`/hub/${clientId}`), page.url());

  const h1 = await page.textContent("h1");
  check("client name rendered", h1?.includes("SPH Auto Parts") ?? false, h1 ?? "<none>");

  const digestNew = await page.textContent('[data-testid="digest-new"]');
  check(
    "digest new-count matches DB",
    digestNew?.includes(`${newCount} new trend opportunities`) ?? false,
    digestNew?.trim().slice(0, 80),
  );
  check(
    "digest hot-count matches DB",
    digestNew?.includes(`${hot} marked`) ?? false,
    `expected hot=${hot}`,
  );

  const localSignals = await page.textContent('[data-testid="digest-local"]');
  check(
    "local signals rendered",
    (localSignals ?? "").includes("Canada Day") && (localSignals ?? "").includes("road-trip"),
  );

  const hotPreviews = await page.locator('[data-testid="hot-preview"]').count();
  check("hot previews rendered (≤3)", hotPreviews > 0 && hotPreviews <= 3, `count=${hotPreviews}`);

  const discoveredChip = await page.textContent('[data-testid="pipeline-discovered"]');
  check("pipeline discovered-count matches DB", discoveredChip?.trim() === String(total), `chip=${discoveredChip}`);
  for (const stage of ["shortlisted", "analyzed", "briefed"]) {
    const chip = await page.textContent(`[data-testid="pipeline-${stage}"]`);
    check(`pipeline ${stage} is 0 on fresh seed`, chip?.trim() === "0", `chip=${chip}`);
  }

  check("fixture-data badge visible", (await page.getByText("fixture data").count()) > 0);

  await page.screenshot({ path: path.join(OUT_DIR, "hub-desktop.png"), fullPage: true });

  // Radar door navigates to the feed
  await page.click('[data-testid="door-radar"]');
  await page.waitForURL(`**/radar/${clientId}`);
  check("Trend Radar door navigates", page.url().includes(`/radar/${clientId}`));

  // ============ Iteration 2: Trend Radar ============
  const cards = page.locator('[data-testid="opportunity-card"]');
  const inboxCount = await cards.count();
  check("radar inbox shows all discovered", inboxCount === total, `cards=${inboxCount} vs db=${total}`);

  // Feed order matches DB expectation (top score first, no rejections yet)
  const dbTop = db
    .prepare(
      "SELECT title FROM opportunities WHERE client_id = ? AND state='discovered' ORDER BY json_extract(score_json,'$.total') DESC LIMIT 1",
    )
    .get(clientId).title;
  const firstTitle = await cards.first().locator("h3").textContent();
  check("rank #1 matches DB top score", firstTitle?.trim() === dbTop, `ui="${firstTitle}" db="${dbTop}"`);

  // Evidence + reasons + provenance visible on the first card without opening it
  const firstCard = cards.first();
  const evidence = (await firstCard.locator('[data-testid="card-evidence"]').textContent()) ?? "";
  check(
    "evidence row complete (views/likes/comments/shares/engagement/baseline)",
    ["views", "likes", "comments", "shares", "engagement", "baseline"].every((w) => evidence.includes(w)),
    evidence.trim().slice(0, 90),
  );
  check("published age visible", (await firstCard.locator('[data-testid="card-published"]').count()) === 1);
  check(
    "provenance + confidence badge on card",
    ((await firstCard.locator('[data-testid="provenance-badge"]').textContent()) ?? "").includes("fixture"),
  );
  const chipTexts = (await firstCard.locator('[data-testid="score-chips"]').textContent()) ?? "";
  check(
    "all four score-component chips with reasons",
    ["viral", "brand fit", "production", "fresh"].every((c) => chipTexts.includes(c)),
    chipTexts.slice(0, 80),
  );
  check(
    "four actions present (Watch/Analyze/Shortlist/Reject)",
    await (async () => {
      const t = (await firstCard.locator('[data-testid="card-actions"]').textContent()) ?? "";
      return ["Watch", "Analyze", "Shortlist", "Reject"].every((a) => t.includes(a));
    })(),
  );

  const waitForCards = (n) =>
    page.waitForFunction(
      (expected) =>
        document.querySelectorAll('[data-testid="opportunity-card"]').length === expected,
      n,
    );

  // Filters: platform=youtube shows only YouTube cards
  const dbYt = db
    .prepare(
      "SELECT COUNT(*) n FROM opportunities WHERE client_id=? AND state='discovered' AND json_extract(video_json,'$.platform')='youtube'",
    )
    .get(clientId).n;
  await page.selectOption('[data-testid="filter-platform"]', "youtube");
  await waitForCards(dbYt);
  const ytBadPlatform = await page
    .locator('[data-testid="opportunity-card"]:not([data-platform="youtube"])')
    .count();
  check("platform filter: only YouTube cards", ytBadPlatform === 0, `ui=${dbYt} non-yt=${ytBadPlatform}`);
  await page.selectOption('[data-testid="filter-platform"]', "");
  await waitForCards(total);

  // Difficulty filter: heavy narrows the feed to hard-to-reproduce formats
  await page.selectOption('[data-testid="filter-difficulty"]', "heavy");
  await page.waitForFunction((n) => {
    const c = document.querySelectorAll('[data-testid="opportunity-card"]').length;
    return c > 0 && c < n;
  }, total);
  const heavyCards = await page.locator('[data-testid="opportunity-card"]').count();
  check("difficulty filter narrows feed", heavyCards > 0 && heavyCards < total, `heavy=${heavyCards}`);
  await page.selectOption('[data-testid="filter-difficulty"]', "");
  await waitForCards(total);

  // Language filter: fr shows exactly the French fixtures
  const dbFr = db
    .prepare(
      "SELECT COUNT(*) n FROM opportunities WHERE client_id=? AND state='discovered' AND json_extract(video_json,'$.language')='fr'",
    )
    .get(clientId).n;
  await page.selectOption('[data-testid="filter-language"]', "fr");
  await waitForCards(dbFr);
  check("language filter matches DB", dbFr > 0, `fr cards=${dbFr}`);
  await page.selectOption('[data-testid="filter-language"]', "");
  await waitForCards(total);

  // Shortlist: top card moves out of inbox, DB + hub pipeline update
  const shortlistedTitle = (await page
    .locator('[data-testid="opportunity-card"]')
    .first()
    .locator("h3")
    .textContent())?.trim();
  await page.locator('[data-testid="action-shortlist"]').first().click();
  await page.waitForFunction(
    (n) => document.querySelectorAll('[data-testid="opportunity-card"]').length === n,
    total - 1,
  );
  const dbShortlisted = db
    .prepare("SELECT COUNT(*) n FROM opportunities WHERE client_id=? AND state='shortlisted'")
    .get(clientId).n;
  check("shortlist persists to DB", dbShortlisted === 1, `db shortlisted=${dbShortlisted}`);
  await page.click('[data-testid="tab-shortlisted"]');
  // client-side nav: wait for the tab's DOM, not load state
  await page.waitForSelector('[data-testid="opportunity-card"][data-state="shortlisted"]');
  const shortTabTitle = (await page
    .locator('[data-testid="opportunity-card"] h3')
    .first()
    .textContent())?.trim();
  check("shortlisted card in Shortlisted tab", shortTabTitle === shortlistedTitle, `"${shortTabTitle}"`);

  // Reject with reason from the inbox; expect KB row + learning chip on similar card
  await page.click('[data-testid="tab-inbox"]');
  await waitForCards(total - 1); // inbox after one shortlist
  const rejectedTitle = (await page
    .locator('[data-testid="opportunity-card"]')
    .first()
    .locator("h3")
    .textContent())?.trim();
  await page.locator('[data-testid="action-reject"]').first().click();
  await page.locator('[data-testid="reject-off-brand"]').first().click();
  await page.waitForFunction(
    (n) => document.querySelectorAll('[data-testid="opportunity-card"]').length === n,
    total - 2,
  );
  const kbRow = db
    .prepare("SELECT reason, kind FROM kb_decisions WHERE client_id=? ORDER BY id DESC LIMIT 1")
    .get(clientId);
  check(
    "rejection recorded in Knowledge Base with reason",
    kbRow?.kind === "rejected" && kbRow?.reason === "off-brand",
    JSON.stringify(kbRow),
  );
  const learningChips = await page.locator('[data-testid="learning-chip"]').count();
  check("learning chip appears on similar cards", learningChips > 0, `chips=${learningChips}`);

  // Rejected tab shows the right card with its reason + reopen restores to inbox
  await page.click('[data-testid="tab-rejected"]');
  await page.waitForSelector('[data-testid="opportunity-card"][data-state="rejected"]');
  const rejTabTitle = (await page.locator('[data-testid="opportunity-card"] h3').first().textContent())?.trim();
  check("rejected card in Rejected tab", rejTabTitle === rejectedTitle, `"${rejTabTitle}"`);
  const rejCardText = (await page.locator('[data-testid="card-rejection"]').first().textContent()) ?? "";
  check("rejected card shows its reason", rejCardText.includes("off-brand"), rejCardText.trim());
  await page.locator('[data-testid="action-reopen"]').first().click();
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="opportunity-card"]').length === 0,
  );
  const dbRejected = db
    .prepare("SELECT COUNT(*) n FROM opportunities WHERE client_id=? AND state='rejected'")
    .get(clientId).n;
  check("reopen returns card to discovered", dbRejected === 0, `db rejected=${dbRejected}`);
  check(
    "KB keeps the rejection decision after reopen",
    db.prepare("SELECT COUNT(*) n FROM kb_decisions WHERE client_id=? AND kind='rejected'").get(clientId).n === 1,
  );

  // Hub pipeline reflects the shortlist
  await page.goto(`${BASE_URL}/hub/${clientId}`, { waitUntil: "networkidle" });
  const hubShortChip = await page.textContent('[data-testid="pipeline-shortlisted"]');
  check("hub pipeline shows 1 shortlisted", hubShortChip?.trim() === "1", `chip=${hubShortChip}`);

  // Radar screenshot (back on inbox)
  await page.goto(`${BASE_URL}/radar/${clientId}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(OUT_DIR, "radar-desktop.png"), fullPage: true });

  // ============ Iteration 3: Opportunity Detail (permanent evidence page) ============
  const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));

  // Inbox top card is the reopened "$40 fix" — richest dossier (rejection + KB history)
  const topInbox = db
    .prepare(
      "SELECT id, title, json_extract(video_json,'$.metrics.views') views FROM opportunities WHERE client_id=? AND state='discovered' ORDER BY json_extract(score_json,'$.total') DESC LIMIT 1",
    )
    .get(clientId);
  await page.getByRole("link", { name: "Analyze →" }).first().click();
  await page.waitForURL("**/opportunity/**");
  check("Analyze navigates to Opportunity Detail", page.url().includes("/opportunity/"));

  const SECTION_IDS = [
    "metrics", "score", "analysis", "brand", "similar", "published",
    "decisions", "approvals", "rejections", "kb", "planner",
  ];
  let allSections = true;
  for (const sid of SECTION_IDS) {
    if ((await page.locator(`[data-testid="section-${sid}"]`).count()) !== 1) {
      allSections = false;
      console.log(`   missing section: ${sid}`);
    }
  }
  check(`all ${SECTION_IDS.length} dossier sections render`, allSections);

  const metricsText = (await page.locator('[data-testid="section-metrics"]').textContent()) ?? "";
  check(
    "metric evidence matches DB views",
    metricsText.includes(fmt(topInbox.views)),
    `expects ${fmt(topInbox.views)}`,
  );
  check("metric provenance + fetched timestamp shown", metricsText.includes("fixture") && metricsText.includes("fetched"));

  const scoreText = (await page.locator('[data-testid="section-score"]').textContent()) ?? "";
  check(
    "score anatomy shows all four weights",
    ["40%", "25%", "20%", "15%"].every((w) => scoreText.includes(w)),
  );

  const decisionsText = (await page.locator('[data-testid="section-decisions"]').textContent()) ?? "";
  check("decision history includes harvest event", decisionsText.includes("harvested into the feed"));

  // This card was rejected then reopened in the earlier flow:
  const rejectionsText = (await page.locator('[data-testid="section-rejections"]').textContent()) ?? "";
  check("rejection history survives reopen", rejectionsText.includes("later reopened"), rejectionsText.trim().slice(0, 60));
  const kbText = (await page.locator('[data-testid="section-kb"]').textContent()) ?? "";
  check("KB reference row shown (rejected decision)", kbText.includes("rejected") && kbText.includes("off-brand"));

  check("related published content found", (await page.locator('[data-testid="section-published"] li').count()) > 0);
  const plannerText = (await page.locator('[data-testid="section-planner"]').textContent()) ?? "";
  check("planner linkage shows honest not-planned state", plannerText.includes("Not planned yet"));
  check(
    "AI analysis section present, run gated pre-shortlist",
    (await page.locator('[data-testid="run-analysis"]').isDisabled()) === true,
  );

  // Similar opportunities link navigates to another dossier
  const similarLinks = await page.locator('[data-testid="similar-link"]').count();
  check("similar opportunities listed", similarLinks > 0, `links=${similarLinks}`);
  const beforeUrl = page.url();
  await page.locator('[data-testid="similar-link"]').first().click();
  await page.waitForFunction((prev) => location.href !== prev, beforeUrl);
  check("similar link navigates to another opportunity", page.url().includes("/opportunity/") && page.url() !== beforeUrl);

  // Shortlisted opportunity shows gate A1 passed
  const shortId = db
    .prepare("SELECT id FROM opportunities WHERE client_id=? AND state='shortlisted' LIMIT 1")
    .get(clientId).id;
  await page.goto(`${BASE_URL}/opportunity/${encodeURIComponent(shortId)}`, { waitUntil: "networkidle" });
  const gateA1 = (await page.locator('[data-gate="shortlisted"]').textContent()) ?? "";
  check("approvals: gate A1 passed for shortlisted opp", gateA1.includes("passed") && gateA1.includes("strategist"), gateA1.trim().slice(0, 70));
  const gateA3 = (await page.locator('[data-gate="planned"]').textContent()) ?? "";
  check("approvals: gate A3 honestly not reached", gateA3.includes("not reached"));

  // Guardrail fixture shows a Brand DNA conflict
  const guardId = db
    .prepare("SELECT id FROM opportunities WHERE client_id=? AND title LIKE 'Street takeover%' LIMIT 1")
    .get(clientId).id;
  await page.goto(`${BASE_URL}/opportunity/${encodeURIComponent(guardId)}`, { waitUntil: "networkidle" });
  const guardText = (await page.locator('[data-testid="guardrail-conflict"]').textContent()) ?? "";
  check("guardrail conflict surfaced in Brand DNA section", guardText.includes("street racing") || guardText.includes("crash"), guardText.trim().slice(0, 70));

  await page.goto(`${BASE_URL}/opportunity/${encodeURIComponent(topInbox.id)}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(OUT_DIR, "detail-desktop.png"), fullPage: true });

  // ============ Iteration 4: Deep AI Analysis ============
  // Gate A1: on a discovered (not shortlisted) opportunity the Run button is disabled
  const gatedBtn = page.locator('[data-testid="run-analysis"]');
  check(
    "analysis gated on discovered opp (shortlist first)",
    (await gatedBtn.isDisabled()) && ((await gatedBtn.textContent()) ?? "").includes("shortlist first"),
  );

  // On the shortlisted opportunity: run analysis (fixture engine — no API key in env)
  await page.goto(`${BASE_URL}/opportunity/${encodeURIComponent(shortId)}`, { waitUntil: "networkidle" });
  const runBtn = page.locator('[data-testid="run-analysis"]');
  check("run button enabled on shortlisted opp", !(await runBtn.isDisabled()));
  await runBtn.click();
  await page.waitForSelector('[data-testid="analysis-result"]', { timeout: 30_000 });
  check("analysis result renders after run", true);

  const analysisText = (await page.locator('[data-testid="analysis-result"]').textContent()) ?? "";
  check(
    "analysis has verdict + confidence + all narrative sections",
    (await page.locator('[data-testid="analysis-verdict"]').count()) === 1 &&
      analysisText.includes("confidence:") &&
      analysisText.includes("Why it went viral") &&
      analysisText.includes("transferable pattern") &&
      analysisText.includes("Watch out"),
  );
  const engineBadge = (await page.locator('[data-testid="analysis-engine"]').textContent()) ?? "";
  check("engine provenance shown (fixture engine, honestly labeled)", engineBadge.includes("fixture-engine"), engineBadge.trim().slice(0, 60));

  // Persistence: DB has the analysis, state advanced shortlisted → analyzed
  const dbAnalyzed = db
    .prepare("SELECT state, analysis_json FROM opportunities WHERE id = ?")
    .get(shortId);
  check("analysis cached in DB", dbAnalyzed?.analysis_json != null && JSON.parse(dbAnalyzed.analysis_json).verdict != null);
  check("state advanced to analyzed", dbAnalyzed?.state === "analyzed", `state=${dbAnalyzed?.state}`);

  // Cache survives reload — analysis renders with no Run button
  await page.goto(`${BASE_URL}/opportunity/${encodeURIComponent(shortId)}`, { waitUntil: "networkidle" });
  check(
    "cached analysis renders on reload (no re-run offered)",
    (await page.locator('[data-testid="analysis-result"]').count()) === 1 &&
      (await page.locator('[data-testid="run-analysis"]').count()) === 0,
  );
  const decisionsAfter = (await page.locator('[data-testid="section-decisions"]').textContent()) ?? "";
  check("decision history records shortlisted → analyzed", decisionsAfter.includes("shortlisted → analyzed"));
  await page.screenshot({ path: path.join(OUT_DIR, "analysis-desktop.png"), fullPage: true });

  // Analyzed items stay visible in the Shortlisted tab; hub pipeline updates
  await page.goto(`${BASE_URL}/radar/${clientId}?tab=shortlisted`, { waitUntil: "networkidle" });
  const analyzedInTab = await page
    .locator('[data-testid="opportunity-card"][data-state="analyzed"]')
    .count();
  check("analyzed card remains in Shortlisted tab", analyzedInTab === 1, `count=${analyzedInTab}`);
  await page.goto(`${BASE_URL}/hub/${clientId}`, { waitUntil: "networkidle" });
  const hubAnalyzed = await page.textContent('[data-testid="pipeline-analyzed"]');
  check("hub pipeline shows 1 analyzed", hubAnalyzed?.trim() === "1", `chip=${hubAnalyzed}`);

  // Narrow viewport
  await page.setViewportSize({ width: 420, height: 900 });
  await page.goto(`${BASE_URL}/hub/${clientId}`, { waitUntil: "networkidle" });
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  check("hub: no horizontal overflow at 420px", !horizontalOverflow);
  await page.screenshot({ path: path.join(OUT_DIR, "hub-mobile.png"), fullPage: true });

  await page.goto(`${BASE_URL}/radar/${clientId}`, { waitUntil: "networkidle" });
  const radarOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  check("radar: no horizontal overflow at 420px", !radarOverflow);
  await page.screenshot({ path: path.join(OUT_DIR, "radar-mobile.png"), fullPage: true });

  await page.goto(`${BASE_URL}/opportunity/${encodeURIComponent(topInbox.id)}`, { waitUntil: "networkidle" });
  const detailOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  check("detail: no horizontal overflow at 420px", !detailOverflow);
  await page.screenshot({ path: path.join(OUT_DIR, "detail-mobile.png"), fullPage: true });
} finally {
  await browser.close();
}

console.log(
  failures.length === 0
    ? `\nRUNTIME VALIDATION PASSED — screenshots in ${OUT_DIR}`
    : `\nRUNTIME VALIDATION FAILED: ${failures.join(", ")}`,
);
process.exit(failures.length === 0 ? 0 : 1);
