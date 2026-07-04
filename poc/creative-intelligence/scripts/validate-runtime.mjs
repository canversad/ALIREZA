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

  // Radar door navigates to the stub route
  await page.click('[data-testid="door-radar"]');
  await page.waitForURL(`**/radar/${clientId}`);
  check("Trend Radar door navigates", page.url().includes(`/radar/${clientId}`));
  await page.goBack({ waitUntil: "networkidle" });

  // Narrow viewport
  await page.setViewportSize({ width: 420, height: 900 });
  await page.goto(`${BASE_URL}/hub/${clientId}`, { waitUntil: "networkidle" });
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  check("no horizontal overflow at 420px", !horizontalOverflow);
  await page.screenshot({ path: path.join(OUT_DIR, "hub-mobile.png"), fullPage: true });
} finally {
  await browser.close();
}

console.log(
  failures.length === 0
    ? `\nRUNTIME VALIDATION PASSED — screenshots in ${OUT_DIR}`
    : `\nRUNTIME VALIDATION FAILED: ${failures.join(", ")}`,
);
process.exit(failures.length === 0 ? 0 : 1);
