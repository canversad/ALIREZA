import type { DatabaseSync } from "node:sqlite";
import type { KnowledgeBaseDecision, KnowledgeBasePort } from "@/core/ports";

/**
 * Local stand-in for the platform's Knowledge Base, honoring the write
 * contract (decisions, not dumps). The real platform adapter replaces this
 * class at integration time; callers only see KnowledgeBasePort.
 */
export class SqliteKnowledgeBase implements KnowledgeBasePort {
  constructor(private db: DatabaseSync) {}

  async recordDecision(entry: KnowledgeBaseDecision): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO kb_decisions (client_id, opportunity_id, kind, summary, reason, at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(entry.clientId, entry.opportunityId, entry.kind, entry.summary, entry.reason ?? null, entry.at);
  }

  async listDecisions(clientId: string): Promise<KnowledgeBaseDecision[]> {
    const rows = this.db
      .prepare("SELECT client_id, opportunity_id, kind, summary, reason, at FROM kb_decisions WHERE client_id = ? ORDER BY at DESC")
      .all(clientId) as unknown as {
      client_id: string;
      opportunity_id: string;
      kind: KnowledgeBaseDecision["kind"];
      summary: string;
      reason: string | null;
      at: string;
    }[];
    return rows.map((r) => ({
      clientId: r.client_id,
      opportunityId: r.opportunity_id,
      kind: r.kind,
      summary: r.summary,
      reason: r.reason ?? undefined,
      at: r.at,
    }));
  }
}
