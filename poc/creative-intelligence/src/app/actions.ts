"use server";

/**
 * Server actions for curation decisions. Every decision goes through the
 * state machine (illegal transitions throw) and rejections are written to
 * the Knowledge Base as reusable learning signals.
 */
import { revalidatePath } from "next/cache";
import { getContainer } from "@/adapters/container";
import type { RejectionReason } from "@/core/domain/types";

const ACTOR = "strategist"; // single-user PoC; real identity arrives with integration

function refresh(clientId: string) {
  revalidatePath(`/radar/${clientId}`);
  revalidatePath(`/hub/${clientId}`);
}

export async function shortlistOpportunity(id: string, clientId: string): Promise<void> {
  const c = getContainer();
  await c.opportunities.transition(id, "shortlisted", ACTOR);
  refresh(clientId);
}

export async function rejectOpportunity(
  id: string,
  clientId: string,
  reason: RejectionReason,
): Promise<void> {
  const c = getContainer();
  const at = new Date().toISOString();
  const updated = await c.opportunities.transition(id, "rejected", ACTOR, {
    rejection: { reason, by: ACTOR, at },
  });
  await c.knowledgeBase.recordDecision({
    clientId,
    opportunityId: id,
    kind: "rejected",
    summary: `Rejected: ${updated.title}`,
    reason,
    at,
  });
  refresh(clientId);
}

/** Reverse a decision: rejected → discovered (reopen) or shortlisted → discovered. */
export async function reopenOpportunity(id: string, clientId: string): Promise<void> {
  const c = getContainer();
  await c.opportunities.transition(id, "discovered", ACTOR, { note: "reopened" });
  refresh(clientId);
}
