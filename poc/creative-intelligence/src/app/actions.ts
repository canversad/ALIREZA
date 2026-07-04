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

/**
 * Tier-2 deep analysis: on explicit request only, gated behind shortlisting
 * (gate A1 — cost follows curation), cached permanently once generated.
 */
export async function runDeepAnalysis(
  id: string,
  clientId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = getContainer();
  const opportunity = await c.opportunities.get(id);
  if (!opportunity) return { ok: false, error: "Opportunity not found." };
  if (opportunity.analysis) return { ok: true }; // cached — never regenerated silently
  if (opportunity.state === "discovered" || opportunity.state === "rejected") {
    return {
      ok: false,
      error: "Shortlist this opportunity first — deep analysis runs only on curated items.",
    };
  }
  const [brandDna, client] = await Promise.all([
    c.brandDna.get(clientId),
    c.clients.get(clientId),
  ]);
  if (!brandDna || !client) return { ok: false, error: "Client context not found." };

  try {
    const analysis = await c.analysis.analyze({ opportunity, brandDna, client });
    await c.opportunities.setAnalysis(id, analysis);
    if (opportunity.state === "shortlisted") {
      await c.opportunities.transition(id, "analyzed", c.analysis.id);
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Analysis failed." };
  }
  revalidatePath(`/opportunity/${id}`);
  refresh(clientId);
  return { ok: true };
}
