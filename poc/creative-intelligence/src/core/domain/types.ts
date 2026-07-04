/**
 * Core domain model for the Creative Intelligence PoC.
 *
 * Design source: design/content-research-workflow.md — one "Opportunity"
 * object unifies Path A (trend-driven) and Path B (original ideas).
 * This module is pure: no framework, no I/O, no adapter imports.
 */

export type Platform = "tiktok" | "youtube" | "instagram";

/**
 * Where a metric came from. Rendered as a badge everywhere a number is shown —
 * the design doc's trust discipline: no number without provenance.
 */
export type Provenance = "fixture" | "official-api" | "scraper";

export type OpportunitySource = "trend" | "original";

export type OpportunityState =
  | "discovered"
  | "shortlisted"
  | "analyzed"
  | "briefed"
  | "approved"
  | "pitched"
  | "planned"
  | "rejected";

/** Production formats the adaptability heuristic understands. */
export type VideoFormat =
  | "counter-demo"
  | "talking-head"
  | "pov-skit"
  | "checklist"
  | "before-after"
  | "myth-bust"
  | "cinematic-build"
  | "vlog-tour"
  | "reaction";

export interface Creator {
  handle: string;
  displayName: string;
  followerCount: number;
}

export interface VideoMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  /** (likes + comments + shares) / views */
  engagementRate: number;
  /** views / creator follower count */
  overperformance: number;
}

/** Evidence bundle for a trend-sourced opportunity: a real (or fixture) viral video. */
export interface VideoEvidence {
  platform: Platform;
  url: string;
  title: string;
  creator: Creator;
  publishedAt: string; // ISO timestamp
  durationSec: number;
  format: VideoFormat;
  tags: string[];
  metrics: VideoMetrics;
  provenance: Provenance;
  fetchedAt: string; // ISO timestamp
  /** BCP-47-ish language code when the source exposes it (e.g. "en", "fr"). */
  language?: string;
  /** Country/region code when available (e.g. "CA", "US") — often absent. */
  region?: string;
}

/** One component of the Opportunity Score, always with a human-readable reason. */
export interface ScoreComponent {
  /** 0..1 */
  value: number;
  /** Plain-language chip text, e.g. "42× creator baseline" */
  reason: string;
}

export interface ScoreBreakdown {
  virality: ScoreComponent;
  brandFit: ScoreComponent;
  adaptability: ScoreComponent;
  freshness: ScoreComponent;
  /** 0..100 weighted total */
  total: number;
  /** One-line "why here" shown on feed cards */
  whyHere: string;
  /** Rising fast: high velocity and very recent */
  hot: boolean;
}

export interface StateTransition {
  from: OpportunityState;
  to: OpportunityState;
  at: string; // ISO timestamp
  by: string; // actor: "system" | user identifier
  note?: string;
}

export interface Rejection {
  reason: RejectionReason;
  note?: string;
  by: string;
  at: string;
}

export type RejectionReason =
  | "off-brand"
  | "cannot-produce"
  | "seen-it"
  | "wrong-audience"
  | "client-passed"
  | "other";

export interface Opportunity {
  id: string;
  clientId: string;
  source: OpportunitySource;
  title: string;
  state: OpportunityState;
  video?: VideoEvidence; // present when source === "trend"
  score: ScoreBreakdown;
  createdAt: string;
  updatedAt: string;
  stateHistory: StateTransition[];
  rejection?: Rejection;
}

export interface ClientProfile {
  id: string;
  name: string;
  industry: string;
  location: string;
  /**
   * The human-approved keyword universe (design doc D1) — governs discovery.
   * Editable via the niche-setup wizard in a later iteration.
   */
  nicheKeywords: string[];
  /** City-scoped signals surfaced on the hub (local events, seasonal moments). */
  localSignals: LocalSignal[];
}

export interface LocalSignal {
  label: string;
  kind: "local-event" | "seasonal";
  window: string; // e.g. "Jul 1–7"
}

/**
 * A piece of content the client already published (read-only view of the
 * platform's content history, accessed via PublishedContentPort).
 */
export interface PublishedContent {
  id: string;
  clientId: string;
  title: string;
  platform: Platform;
  publishedAt: string;
  tags: string[];
  performance: {
    views: number;
    /** e.g. 2.12 = +112% vs the account's average post */
    vsAccountAverage: number;
  };
  url?: string;
}

/** Read-only view of the platform's Brand DNA concept (accessed via port). */
export interface BrandDNA {
  clientId: string;
  traits: string[];
  tone: string;
  audience: string;
  productLines: string[];
  /** Content the brand must never be associated with. */
  guardrails: string[];
}
