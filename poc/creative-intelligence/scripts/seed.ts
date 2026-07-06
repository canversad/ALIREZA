/**
 * Seed the local SQLite store.
 *   npm run seed            — seed if empty
 *   npm run seed -- --reset — wipe and reseed
 *
 * Uses whichever discovery/analysis providers the env selects (real when their
 * keys are present, fixture otherwise). Next.js loads .env.local automatically,
 * but this is a standalone tsx script, so — exactly like probe-youtube.ts — it
 * must load the env itself BEFORE the container reads process.env.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { getContainer } from "../src/adapters/container";
import { runHarvest } from "../src/adapters/seed-harvest";
import { resetDb } from "../src/adapters/sqlite/db";

async function main() {
  const reset = process.argv.includes("--reset");
  const c = getContainer();
  if (reset) {
    resetDb();
    console.log("store wiped");
  }
  if (!(await c.opportunities.isEmpty())) {
    console.log("store already seeded — use --reset to reseed");
    return;
  }
  const n = await runHarvest(c);
  console.log(`seeded ${n} opportunities from provider "${c.discovery.id}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
