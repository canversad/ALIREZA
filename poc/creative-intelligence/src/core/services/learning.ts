/**
 * Rejection-derived learning signals (Iteration 2, requirement #5).
 *
 * Every rejection teaches the feed: candidates sharing traits with rejected
 * opportunities get a small, capped, VISIBLE ranking penalty. The base score
 * is never mutated — the adjustment renders as its own labeled chip, so the
 * strategist always sees both the score and why it moved.
 *
 * Similarity definition lives in similarity.ts (shared with the Opportunity
 * Detail page). An LLM-based upgrade can replace this behind the same shape.
 */
import type { Opportunity } from "../domain/types";
import { traitOverlap } from "./similarity";

export interface LearningAdjustment {
  /** Points subtracted from the displayed ranking score (0–15). */
  penalty: number;
  /** Chip text, e.g. "similar to 2 rejected (pov-skit)" */
  why: string;
}

const MAX_PENALTY = 15;

export function computeLearningAdjustments(
  candidates: Opportunity[],
  rejected: Opportunity[],
): Map<string, LearningAdjustment> {
  const result = new Map<string, LearningAdjustment>();
  const rejectedWithVideo = rejected.filter((r) => r.video);
  if (rejectedWithVideo.length === 0) return result;

  for (const c of candidates) {
    if (!c.video || c.state === "rejected") continue;
    let penalty = 0;
    let matches = 0;
    const traitScores = new Map<string, number>();

    for (const r of rejectedWithVideo) {
      const overlap = traitOverlap(c.video, r.video!);
      if (overlap.points > 0) {
        penalty += overlap.points;
        matches += 1;
        // strongest trait of this pair gets credited for the chip label
        const top = overlap.traits[0];
        if (top) traitScores.set(top, (traitScores.get(top) ?? 0) + overlap.points);
      }
    }

    if (penalty > 0) {
      const topTrait = [...traitScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      result.set(c.id, {
        penalty: Math.min(MAX_PENALTY, Math.round(penalty)),
        why: `similar to ${matches} rejected${topTrait ? ` (${topTrait})` : ""}`,
      });
    }
  }
  return result;
}
