/**
 * Rejection-derived learning signals (design requirement #5, Iteration 2).
 *
 * Every rejection teaches the feed: candidates sharing traits with rejected
 * opportunities (same creator, same format, overlapping tags) get a small,
 * capped, VISIBLE ranking penalty. The base score is never mutated — the
 * adjustment renders as its own labeled chip, so the strategist always sees
 * both the score and why it moved.
 *
 * Deliberately simple and transparent. An LLM-based similarity upgrade can
 * replace this behind the same shape later.
 */
import type { Opportunity } from "../domain/types";

export interface LearningAdjustment {
  /** Points subtracted from the displayed ranking score (0–15). */
  penalty: number;
  /** Chip text, e.g. "similar to 2 rejected (pov-skit)" */
  why: string;
}

const MAX_PENALTY = 15;
const CREATOR_WEIGHT = 6;
const FORMAT_WEIGHT = 3;
const TAG_WEIGHT = 1.5;
const TAG_CAP = 3;

export function computeLearningAdjustments(
  candidates: Opportunity[],
  rejected: Opportunity[],
): Map<string, LearningAdjustment> {
  const result = new Map<string, LearningAdjustment>();
  const rejectedVideos = rejected
    .filter((r) => r.video)
    .map((r) => ({
      creator: r.video!.creator.handle,
      format: r.video!.format,
      tags: new Set(r.video!.tags),
    }));
  if (rejectedVideos.length === 0) return result;

  for (const c of candidates) {
    if (!c.video || c.state === "rejected") continue;
    let penalty = 0;
    let matches = 0;
    const traits = new Map<string, number>();

    for (const r of rejectedVideos) {
      let overlap = 0;
      if (r.creator === c.video.creator.handle) {
        overlap += CREATOR_WEIGHT;
        traits.set(c.video.creator.handle, (traits.get(c.video.creator.handle) ?? 0) + CREATOR_WEIGHT);
      }
      if (r.format === c.video.format) {
        overlap += FORMAT_WEIGHT;
        traits.set(c.video.format, (traits.get(c.video.format) ?? 0) + FORMAT_WEIGHT);
      }
      const shared = c.video.tags.filter((t) => r.tags.has(t));
      if (shared.length > 0) {
        const tagScore = Math.min(TAG_CAP, shared.length * TAG_WEIGHT);
        overlap += tagScore;
        traits.set(shared[0], (traits.get(shared[0]) ?? 0) + tagScore);
      }
      if (overlap > 0) {
        penalty += overlap;
        matches += 1;
      }
    }

    if (penalty > 0) {
      const topTrait = [...traits.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      result.set(c.id, {
        penalty: Math.min(MAX_PENALTY, Math.round(penalty)),
        why: `similar to ${matches} rejected${topTrait ? ` (${topTrait})` : ""}`,
      });
    }
  }
  return result;
}
