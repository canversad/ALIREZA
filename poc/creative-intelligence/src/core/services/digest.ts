/**
 * Research Hub digest (design doc Screen 1): "since your last visit".
 * PoC simplification: the window is a fixed trailing 7 days, labeled as such.
 */
import type { Opportunity, ClientProfile, LocalSignal, OpportunityState } from "../domain/types";
import { PIPELINE_STAGES } from "../domain/states";

export interface HubDigest {
  windowLabel: string;
  newCount: number;
  hotCount: number;
  hotPreviews: { id: string; title: string; whyHere: string }[];
  localSignals: LocalSignal[];
  pipeline: { stage: OpportunityState; count: number }[];
}

export function buildHubDigest(
  client: ClientProfile,
  opportunities: Opportunity[],
  counts: Record<OpportunityState, number>,
  newSinceCount: number,
): HubDigest {
  const hot = opportunities
    .filter((o) => o.score.hot && o.state === "discovered")
    .sort((a, b) => b.score.total - a.score.total);

  return {
    windowLabel: "past 7 days",
    newCount: newSinceCount,
    hotCount: hot.length,
    hotPreviews: hot.slice(0, 3).map((o) => ({
      id: o.id,
      title: o.title,
      whyHere: o.score.whyHere,
    })),
    localSignals: client.localSignals,
    pipeline: PIPELINE_STAGES.map((stage) => ({ stage, count: counts[stage] ?? 0 })),
  };
}
