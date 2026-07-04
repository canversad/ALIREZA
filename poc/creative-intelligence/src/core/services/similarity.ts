/**
 * Trait-overlap similarity between videos — one definition, two consumers:
 * the learning penalty (learning.ts) and the "similar past opportunities"
 * section of the Opportunity Detail page.
 */
import type { Opportunity, PublishedContent, VideoEvidence } from "../domain/types";

export const CREATOR_WEIGHT = 6;
export const FORMAT_WEIGHT = 3;
export const TAG_WEIGHT = 1.5;
export const TAG_CAP = 3;

export interface TraitOverlap {
  points: number;
  /** Human-readable shared traits, strongest first. */
  traits: string[];
}

export function traitOverlap(a: VideoEvidence, b: VideoEvidence): TraitOverlap {
  let points = 0;
  const traits: { label: string; w: number }[] = [];
  if (a.creator.handle === b.creator.handle) {
    points += CREATOR_WEIGHT;
    traits.push({ label: a.creator.handle, w: CREATOR_WEIGHT });
  }
  if (a.format === b.format) {
    points += FORMAT_WEIGHT;
    traits.push({ label: a.format, w: FORMAT_WEIGHT });
  }
  const bTags = new Set(b.tags);
  const shared = a.tags.filter((t) => bTags.has(t));
  if (shared.length > 0) {
    const tagScore = Math.min(TAG_CAP, shared.length * TAG_WEIGHT);
    points += tagScore;
    traits.push({ label: shared.join(", "), w: tagScore });
  }
  return { points, traits: traits.sort((x, y) => y.w - x.w).map((t) => t.label) };
}

export interface SimilarOpportunity {
  opportunity: Opportunity;
  overlap: TraitOverlap;
}

/** Top-N most similar opportunities for the same client (excluding self). */
export function findSimilarOpportunities(
  subject: Opportunity,
  all: Opportunity[],
  limit = 5,
): SimilarOpportunity[] {
  if (!subject.video) return [];
  return all
    .filter((o) => o.id !== subject.id && o.video)
    .map((o) => ({ opportunity: o, overlap: traitOverlap(subject.video!, o.video!) }))
    .filter((s) => s.overlap.points > 0)
    .sort((a, b) => b.overlap.points - a.overlap.points)
    .slice(0, limit);
}

export interface RelatedPublished {
  content: PublishedContent;
  sharedTags: string[];
}

/** Previously published client content sharing tags/keywords with this video. */
export function findRelatedPublished(
  video: VideoEvidence,
  published: PublishedContent[],
  limit = 4,
): RelatedPublished[] {
  const corpus = new Set([...video.tags.map((t) => t.toLowerCase())]);
  const title = video.title.toLowerCase();
  return published
    .map((p) => {
      const shared = p.tags.filter(
        (t) => corpus.has(t.toLowerCase()) || title.includes(t.toLowerCase()),
      );
      return { content: p, sharedTags: shared };
    })
    .filter((r) => r.sharedTags.length > 0)
    .sort((a, b) => b.sharedTags.length - a.sharedTags.length)
    .slice(0, limit);
}
