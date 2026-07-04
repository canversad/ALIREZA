/**
 * Composition root. The only place adapters are wired to ports.
 * Auto-seeds from fixtures on first run so `npm run dev` works out of the box
 * (documented in README; `npm run seed -- --reset` forces a fresh seed).
 */
import type {
  BrandDNAPort,
  ClientPort,
  DiscoveryProvider,
  OpportunityRepository,
} from "@/core/ports";
import { getDb } from "./sqlite/db";
import { SqliteOpportunityRepository } from "./sqlite/opportunity-repo";
import {
  FixtureBrandDNAPort,
  FixtureClientPort,
  FixtureDiscoveryProvider,
} from "./fixtures";
import { runHarvest } from "./seed-harvest";

export interface Container {
  clients: ClientPort;
  brandDna: BrandDNAPort;
  opportunities: OpportunityRepository;
  discovery: DiscoveryProvider;
}

let container: Container | null = null;
let seeded = false;

export function getContainer(): Container {
  if (!container) {
    container = {
      clients: new FixtureClientPort(),
      brandDna: new FixtureBrandDNAPort(),
      opportunities: new SqliteOpportunityRepository(getDb()),
      discovery: new FixtureDiscoveryProvider(),
    };
  }
  return container;
}

/** Idempotent bootstrap: seed fixtures if the store is empty. */
export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  const c = getContainer();
  if (await c.opportunities.isEmpty()) {
    await runHarvest(c);
  }
  seeded = true;
}
