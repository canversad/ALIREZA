/**
 * Ports (interfaces) between the domain core and the outside world.
 *
 * Integration contract: the main platform later supplies real adapters for
 * BrandDNAPort / KnowledgeBasePort / PlannerPort. The PoC ships fixture and
 * SQLite adapters. Nothing in src/core imports from src/adapters.
 */
import type {
  BrandDNA,
  ClientProfile,
  Opportunity,
  OpportunityState,
  PublishedContent,
  Rejection,
  VideoEvidence,
} from "../domain/types";

/** A source of harvested candidate videos (fixture now; ScrapeCreators/YouTube later). */
export interface DiscoveryProvider {
  readonly id: string;
  harvest(input: {
    nicheKeywords: string[];
    windowDays: number;
  }): Promise<VideoEvidence[]>;
}

/** Deep AI analysis engine (Iteration 4: Claude adapter + fixture fallback). */
export interface AnalysisEngine {
  readonly id: string;
  analyze(input: {
    opportunity: Opportunity;
    brandDna: BrandDNA;
  }): Promise<OpportunityAnalysis>;
}

export interface OpportunityAnalysis {
  whyItWorked: string;
  transferablePattern: string;
  adaptationAngles: { angle: string; brandTrait: string; effort: "low" | "medium" | "high" }[];
  watchOuts: string[];
  verdict: "strong-adapt" | "possible-adapt" | "skip";
  confidence: "high" | "medium" | "low";
  generatedBy: string; // engine id + model
  generatedAt: string;
}

export interface OpportunityRepository {
  listByClient(clientId: string): Promise<Opportunity[]>;
  get(id: string): Promise<Opportunity | null>;
  saveMany(opportunities: Opportunity[]): Promise<void>;
  transition(
    id: string,
    to: OpportunityState,
    by: string,
    options?: { note?: string; rejection?: Rejection },
  ): Promise<Opportunity>;
  countByState(clientId: string): Promise<Record<OpportunityState, number>>;
  countCreatedSince(clientId: string, sinceIso: string): Promise<number>;
  isEmpty(): Promise<boolean>;
}

/** Read-only access to the platform's Brand DNA (fixture adapter in the PoC). */
export interface BrandDNAPort {
  get(clientId: string): Promise<BrandDNA | null>;
}

export interface ClientPort {
  list(): Promise<ClientProfile[]>;
  get(clientId: string): Promise<ClientProfile | null>;
}

/**
 * Knowledge Base write contract (design doc §6): decisions and distillations,
 * never raw harvests. PoC persists these locally; the real KB adapter replaces it.
 */
export interface KnowledgeBasePort {
  recordDecision(entry: KnowledgeBaseDecision): Promise<void>;
  listDecisions(clientId: string): Promise<KnowledgeBaseDecision[]>;
}

export interface KnowledgeBaseDecision {
  clientId: string;
  opportunityId: string;
  kind: "approved" | "rejected" | "client-verdict";
  summary: string;
  reason?: string;
  at: string;
}

/**
 * Read-only access to the client's previously published content and its
 * performance (the platform's content history supplies the real adapter).
 */
export interface PublishedContentPort {
  listByClient(clientId: string): Promise<PublishedContent[]>;
}

/**
 * Planner hand-off (Phase 3: stub only). The real Content Planner adapter
 * implements this; the PoC will log/store pushes without integrating.
 */
export interface PlannerPort {
  pushApproved(opportunity: Opportunity): Promise<{ accepted: boolean; ref?: string }>;
}
