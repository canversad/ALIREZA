/**
 * Live probe + structural smoke test for the YouTube discovery provider.
 * Needs YOUTUBE_API_KEY in the environment (loaded from .env.local by the app;
 * for this standalone script, run it after your key is exported or via a shell
 * that has it). Real results change daily, so this asserts INVARIANTS, not
 * exact content:
 *   - at least one video returned
 *   - every URL is a real youtube.com/watch link
 *   - metrics are non-negative; engagement/overperformance are finite
 *   - publishedAt is inside the requested window
 *   - provenance is "official-api"
 *
 * Run:  npm run probe:youtube
 */
import { config } from "dotenv";
// Load .env.local (Next.js loads it automatically; a standalone script must ask).
config({ path: ".env.local" });
config({ path: ".env" });
import { YouTubeDiscoveryProvider } from "../src/adapters/discovery/youtube";
import { sphClient } from "../src/adapters/fixtures/sph-auto-parts";

const WINDOW_DAYS = 30;

async function main() {
  if (!process.env.YOUTUBE_API_KEY) {
    console.error("FAIL: YOUTUBE_API_KEY is not set. Add it to .env.local (loaded here via dotenv).");
    process.exit(1);
  }

  const provider = new YouTubeDiscoveryProvider();
  console.log(`Harvesting real YouTube data for "${sphClient.name}" (${WINDOW_DAYS}d window)…\n`);

  const videos = await provider.harvest({
    nicheKeywords: sphClient.nicheKeywords,
    windowDays: WINDOW_DAYS,
  });

  const failures: string[] = [];
  const check = (name: string, ok: boolean, detail = "") => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
    if (!ok) failures.push(name);
  };

  check("returned at least one video", videos.length > 0, `count=${videos.length}`);

  const cutoff = Date.now() - WINDOW_DAYS * 86_400_000;
  const badUrl = videos.find((v) => !/^https:\/\/www\.youtube\.com\/watch\?v=.+/.test(v.url));
  check("all URLs are real youtube.com/watch links", !badUrl, badUrl?.url);

  const badMetric = videos.find(
    (v) =>
      v.metrics.views < 0 ||
      v.metrics.likes < 0 ||
      v.metrics.comments < 0 ||
      !Number.isFinite(v.metrics.engagementRate) ||
      !Number.isFinite(v.metrics.overperformance),
  );
  check("metrics non-negative and finite", !badMetric, badMetric?.title);

  const stale = videos.find((v) => new Date(v.publishedAt).getTime() < cutoff);
  check("all videos within the 30-day window", !stale, stale ? `${stale.title} @ ${stale.publishedAt}` : "");

  const badProv = videos.find((v) => v.provenance !== "official-api");
  check("provenance is official-api", !badProv, badProv?.provenance);

  // Sample table so the human can eyeball real titles + numbers
  const sample = [...videos].sort((a, b) => b.metrics.views - a.metrics.views).slice(0, 10);
  console.log("\nTop 10 by views:");
  for (const v of sample) {
    const days = Math.floor((Date.now() - new Date(v.publishedAt).getTime()) / 86_400_000);
    console.log(
      `  ${v.metrics.views.toLocaleString().padStart(10)} views · ${(v.metrics.engagementRate * 100).toFixed(1)}% eng · ` +
        `${days}d · ${v.format.padEnd(13)} · ${v.title.slice(0, 60)}`,
    );
  }

  console.log(
    failures.length === 0
      ? `\nYOUTUBE PROBE PASSED — ${videos.length} real videos, structure valid.`
      : `\nYOUTUBE PROBE FAILED: ${failures.join(", ")}`,
  );
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\nPROBE ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
});
