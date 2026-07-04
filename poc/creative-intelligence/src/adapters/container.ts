/**
 * Composition root. The only place adapters are wired to ports.
 * Auto-seeds from fixtures on first run so `npm run dev` works out of the box
 * (documented in README; `npm run seed -- --reset` forces a fresh seed).
 */
import type {
  AnalysisEngine,
  BrandDNAPort,
  ClientPort,
  DiscoveryProvider,
  KnowledgeBasePort,
  OpportunityRepository,
  PublishedContentPort,
} from "@/core/ports";
import { ClaudeAnalysisEngine } from "./analysis/claude";
import { FixtureAnalysisEngine } from "./analysis/fixture";
import { getDb } from "./sqlite/db";
import { SqliteOpportunityRepository } from "./sqlite/opportunity-repo";
import { SqliteKnowledgeBase } from "./sqlite/knowledge-base";
import {
  FixtureBrandDNAPort,
  FixtureClientPort,
  FixtureDiscoveryProvider,
} from "./fixtures";
import { FixturePublishedContentPort } from "./fixtures/published-content";
import { runHarvest } from "./seed-harvest";

export interface Container {
  clients: ClientPort;
  brandDna: BrandDNAPort;
  opportunities: OpportunityRepository;
  discovery: DiscoveryProvider;
  knowledgeBase: KnowledgeBasePort;
  publishedContent: PublishedContentPort;
  analysis: AnalysisEngine;
}

let container: Container | null = null;
let seeded = false;

export function getContainer(): Container {
  if (!container) {
    const db = getDb();
    container = {
      clients: new FixtureClientPort(),
      brandDna: new FixtureBrandDNAPort(),
      opportunities: new SqliteOpportunityRepository(db),
      discovery: new FixtureDiscoveryProvider(),
      knowledgeBase: new SqliteKnowledgeBase(db),
      publishedContent: new FixturePublishedContentPort(),
      // Real engine only when a key is configured — the app never hard-fails without one.
      analysis: process.env.ANTHROPIC_API_KEY
        ? new ClaudeAnalysisEngine()
        : new FixtureAnalysisEngine(),
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
