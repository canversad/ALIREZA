/**
 * Opportunity Score (design doc §3, Screen 2):
 *   virality × brand fit × adaptability × freshness/locality
 * Every component carries a plain-language reason — no black-box numbers.
 *
 * Iteration 1 uses deterministic heuristics (keyword overlap vs Brand DNA).
 * Iteration 4 may upgrade brand-fit to an LLM classifier behind the same shape.
 */
import type {
  BrandDNA,
  ClientProfile,
  ScoreBreakdown,
  ScoreComponent,
  VideoEvidence,
  VideoFormat,
} from "../domain/types";

const WEIGHTS = { virality: 0.4, brandFit: 0.25, adaptability: 0.2, freshness: 0.15 };

/** Minimum plays/views to be considered at all, per platform (research §1). */
const REACH_FLOOR: Record<VideoEvidence["platform"], number> = {
  tiktok: 250_000,
  youtube: 100_000,
  instagram: 500_000,
};

/** Production effort implied by format — proxies "can this client produce it?" */
const FORMAT_EFFORT: Record<VideoFormat, number> = {
  "counter-demo": 0.95,
  "talking-head": 0.95,
  checklist: 0.9,
  "myth-bust": 0.85,
  "before-after": 0.8,
  "pov-skit": 0.7,
  reaction: 0.65,
  "vlog-tour": 0.5,
  "cinematic-build": 0.25,
};

const LOCALITY_TERMS = ["toronto", "gta", "ontario", "canada", "canadian"];

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function daysSince(iso: string, now: Date): number {
  return Math.max(0.25, (now.getTime() - new Date(iso).getTime()) / 86_400_000);
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function scoreVirality(video: VideoEvidence, now: Date): ScoreComponent & { velocity: number } {
  const { views, engagementRate, overperformance } = video.metrics;
  const days = daysSince(video.publishedAt, now);
  const velocity = views / days;

  const reach = clamp01(views / (REACH_FLOOR[video.platform] * 10));
  const over = clamp01(overperformance / 20);
  const engagement = clamp01(engagementRate / 0.08);
  const speed = clamp01(velocity / 150_000);

  const value = clamp01(0.3 * reach + 0.3 * over + 0.2 * engagement + 0.2 * speed);
  const reasons: string[] = [`${formatCount(views)} views`];
  if (overperformance >= 3) reasons.push(`${Math.round(overperformance)}× creator baseline`);
  if (engagementRate >= 0.05) reasons.push(`${(engagementRate * 100).toFixed(1)}% engagement`);
  return { value, reason: reasons.join(" · "), velocity: speed };
}

function keywordOverlap(haystack: string, terms: string[]): string[] {
  const text = haystack.toLowerCase();
  return terms.filter((t) => text.includes(t.toLowerCase()));
}

function scoreBrandFit(video: VideoEvidence, brand: BrandDNA, client: ClientProfile): ScoreComponent {
  const corpus = `${video.title} ${video.tags.join(" ")}`;
  const guardrailHits = keywordOverlap(corpus, brand.guardrails);
  if (guardrailHits.length > 0) {
    return { value: 0.05, reason: `conflicts with guardrail: ${guardrailHits[0]}` };
  }
  const nicheHits = keywordOverlap(corpus, client.nicheKeywords);
  const productHits = keywordOverlap(corpus, brand.productLines);
  const traitHits = keywordOverlap(corpus, brand.traits);
  const value = clamp01(0.25 + nicheHits.length * 0.18 + productHits.length * 0.15 + traitHits.length * 0.1);
  const matched = [...new Set([...nicheHits, ...productHits, ...traitHits])];
  const reason =
    matched.length > 0 ? `matches: ${matched.slice(0, 3).join(", ")}` : "adjacent to niche";
  return { value, reason };
}

function scoreAdaptability(video: VideoEvidence): ScoreComponent {
  const effort = FORMAT_EFFORT[video.format];
  const short = video.durationSec <= 75 ? 1 : 0.7;
  const value = clamp01(effort * short);
  const label =
    value >= 0.8 ? "easy to adapt" : value >= 0.5 ? "moderate production" : "heavy production";
  return { value, reason: `${label} (${video.format}, ${video.durationSec}s)` };
}

function scoreFreshness(video: VideoEvidence, now: Date): ScoreComponent {
  const days = daysSince(video.publishedAt, now);
  const decay = Math.pow(0.5, days / 10); // half-life 10 days
  const localHits = keywordOverlap(
    `${video.title} ${video.tags.join(" ")} ${video.creator.displayName}`,
    LOCALITY_TERMS,
  );
  const boost = localHits.length > 0 ? 0.15 : 0;
  const value = clamp01(decay + boost);
  const parts = [`${Math.round(days)}d old`];
  if (localHits.length > 0) parts.push(`local: ${localHits[0]}`);
  return { value, reason: parts.join(" · ") };
}

export function computeScore(
  video: VideoEvidence,
  brand: BrandDNA,
  client: ClientProfile,
  now: Date = new Date(),
): ScoreBreakdown {
  const virality = scoreVirality(video, now);
  const brandFit = scoreBrandFit(video, brand, client);
  const adaptability = scoreAdaptability(video);
  const freshness = scoreFreshness(video, now);

  const total =
    100 *
    (WEIGHTS.virality * virality.value +
      WEIGHTS.brandFit * brandFit.value +
      WEIGHTS.adaptability * adaptability.value +
      WEIGHTS.freshness * freshness.value);

  const days = daysSince(video.publishedAt, now);
  const hot = virality.velocity >= 0.7 && days <= 7;

  const top = [
    { label: virality.reason, v: virality.value * WEIGHTS.virality },
    { label: brandFit.reason, v: brandFit.value * WEIGHTS.brandFit },
    { label: adaptability.reason, v: adaptability.value * WEIGHTS.adaptability },
  ].sort((a, b) => b.v - a.v);

  return {
    virality: { value: virality.value, reason: virality.reason },
    brandFit,
    adaptability,
    freshness,
    total: Math.round(total * 10) / 10,
    whyHere: top[0].label,
    hot,
  };
}
