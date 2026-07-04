import type { OpportunityState } from "./types";

/**
 * The Opportunity lifecycle (design doc §0):
 * discovered → shortlisted → analyzed → briefed → approved → pitched → planned
 * with rejection possible at review gates, and "revise" looping pitched → briefed.
 */
const TRANSITIONS: Record<OpportunityState, OpportunityState[]> = {
  discovered: ["shortlisted", "rejected"],
  shortlisted: ["analyzed", "briefed", "rejected"],
  analyzed: ["briefed", "rejected"],
  briefed: ["approved", "rejected"],
  approved: ["pitched", "rejected"],
  pitched: ["planned", "briefed", "rejected"], // briefed = client asked for revision
  planned: [],
  rejected: [],
};

export function canTransition(
  from: OpportunityState,
  to: OpportunityState,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: OpportunityState,
  to: OpportunityState,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal opportunity transition: ${from} → ${to}`);
  }
}

/** Pipeline stages shown on the Research Hub strip, in display order. */
export const PIPELINE_STAGES: OpportunityState[] = [
  "discovered",
  "shortlisted",
  "analyzed",
  "briefed",
  "approved",
  "pitched",
  "planned",
];
