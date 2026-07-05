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
import { FixtureBrandDNAPort, FixtureClientPort } from "./fixtures";
import { FixturePublishedContentPort } from "./fixtures/published-content";
import { selectDiscoveryProvider } from "./discovery";
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

/**
 * Analysis-engine selection, symmetric to selectDiscoveryProvider:
 *   CI_ANALYSIS_PROVIDER=fixture → always the heuristic engine (pins the suite)
 *   CI_ANALYSIS_PROVIDER=claude  → force Claude (errors if no key)
 *   otherwise: Claude when ANTHROPIC_API_KEY is present, fixture when not.
 */
function selectAnalysisEngine(): AnalysisEngine {
  const forced = process.env.CI_ANALYSIS_PROVIDER;
  if (forced === "fixture") return new FixtureAnalysisEngine();
  if (forced === "claude") return new ClaudeAnalysisEngine();
  return process.env.ANTHROPIC_API_KEY ? new ClaudeAnalysisEngine() : new FixtureAnalysisEngine();
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
      discovery: selectDiscoveryProvider(),
      knowledgeBase: new SqliteKnowledgeBase(db),
      publishedContent: new FixturePublishedContentPort(),
      analysis: selectAnalysisEngine(),
    };
    // Diagnostic: confirms at a glance which engine + provider this process picked.
    console.log(
      `[creative-intelligence] ANTHROPIC_API_KEY ${process.env.ANTHROPIC_API_KEY ? "detected" : "NOT detected"} — analysis engine: ${container.analysis.id}`,
    );
    console.log(
      `[creative-intelligence] YOUTUBE_API_KEY ${process.env.YOUTUBE_API_KEY ? "detected" : "NOT detected"} — discovery provider: ${container.discovery.id}`,
    );
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
