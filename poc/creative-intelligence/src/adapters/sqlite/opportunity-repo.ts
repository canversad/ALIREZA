import type { DatabaseSync } from "node:sqlite";
import type {
  Opportunity,
  OpportunityAnalysis,
  OpportunityState,
  Rejection,
} from "@/core/domain/types";
import { assertTransition } from "@/core/domain/states";
import type { OpportunityRepository } from "@/core/ports";

interface Row {
  id: string;
  client_id: string;
  source: string;
  state: string;
  title: string;
  video_json: string | null;
  score_json: string;
  created_at: string;
  updated_at: string;
  state_history_json: string;
  rejection_json: string | null;
  analysis_json: string | null;
}

function rowToOpportunity(row: Row): Opportunity {
  return {
    id: row.id,
    clientId: row.client_id,
    source: row.source as Opportunity["source"],
    state: row.state as OpportunityState,
    title: row.title,
    video: row.video_json ? JSON.parse(row.video_json) : undefined,
    score: JSON.parse(row.score_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stateHistory: JSON.parse(row.state_history_json),
    rejection: row.rejection_json ? JSON.parse(row.rejection_json) : undefined,
    analysis: row.analysis_json ? JSON.parse(row.analysis_json) : undefined,
  };
}

export class SqliteOpportunityRepository implements OpportunityRepository {
  constructor(private db: DatabaseSync) {}

  async listByClient(clientId: string): Promise<Opportunity[]> {
    const rows = this.db
      .prepare("SELECT * FROM opportunities WHERE client_id = ? ORDER BY json_extract(score_json, '$.total') DESC")
      .all(clientId) as unknown as Row[];
    return rows.map(rowToOpportunity);
  }

  async get(id: string): Promise<Opportunity | null> {
    const row = this.db
      .prepare("SELECT * FROM opportunities WHERE id = ?")
      .get(id) as unknown as Row | undefined;
    return row ? rowToOpportunity(row) : null;
  }

  async saveMany(opportunities: Opportunity[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO opportunities
        (id, client_id, source, state, title, video_json, score_json,
         created_at, updated_at, state_history_json, rejection_json, analysis_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const o of opportunities) {
      stmt.run(
        o.id,
        o.clientId,
        o.source,
        o.state,
        o.title,
        o.video ? JSON.stringify(o.video) : null,
        JSON.stringify(o.score),
        o.createdAt,
        o.updatedAt,
        JSON.stringify(o.stateHistory),
        o.rejection ? JSON.stringify(o.rejection) : null,
        o.analysis ? JSON.stringify(o.analysis) : null,
      );
    }
  }

  async setAnalysis(id: string, analysis: OpportunityAnalysis): Promise<Opportunity> {
    const current = await this.get(id);
    if (!current) throw new Error(`Opportunity not found: ${id}`);
    const updated: Opportunity = {
      ...current,
      analysis,
      updatedAt: new Date().toISOString(),
    };
    await this.saveMany([updated]);
    return updated;
  }

  async transition(
    id: string,
    to: OpportunityState,
    by: string,
    options?: { note?: string; rejection?: Rejection },
  ): Promise<Opportunity> {
    const current = await this.get(id);
    if (!current) throw new Error(`Opportunity not found: ${id}`);
    assertTransition(current.state, to);
    const now = new Date().toISOString();
    const updated: Opportunity = {
      ...current,
      state: to,
      updatedAt: now,
      stateHistory: [
        ...current.stateHistory,
        { from: current.state, to, at: now, by, note: options?.note },
      ],
      rejection:
        to === "rejected"
          ? options?.rejection
          : current.state === "rejected" && to === "discovered"
            ? undefined // reopen clears the active rejection (KB log keeps history)
            : current.rejection,
    };
    await this.saveMany([updated]);
    return updated;
  }

  async countByState(clientId: string): Promise<Record<OpportunityState, number>> {
    const rows = this.db
      .prepare("SELECT state, COUNT(*) as n FROM opportunities WHERE client_id = ? GROUP BY state")
      .all(clientId) as unknown as { state: OpportunityState; n: number }[];
    const counts = {
      discovered: 0,
      shortlisted: 0,
      analyzed: 0,
      briefed: 0,
      approved: 0,
      pitched: 0,
      planned: 0,
      rejected: 0,
    } satisfies Record<OpportunityState, number>;
    for (const r of rows) counts[r.state] = r.n;
    return counts;
  }

  async countCreatedSince(clientId: string, sinceIso: string): Promise<number> {
    const row = this.db
      .prepare("SELECT COUNT(*) as n FROM opportunities WHERE client_id = ? AND created_at >= ?")
      .get(clientId, sinceIso) as unknown as { n: number };
    return row.n;
  }

  async isEmpty(): Promise<boolean> {
    const row = this.db
      .prepare("SELECT COUNT(*) as n FROM opportunities")
      .get() as unknown as { n: number };
    return row.n === 0;
  }
}
