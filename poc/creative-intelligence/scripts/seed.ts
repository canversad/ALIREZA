/**
 * Seed the local SQLite store from fixture data.
 *   npm run seed            — seed if empty
 *   npm run seed -- --reset — wipe and reseed
 */
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
