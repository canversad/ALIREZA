/**
 * SQLite persistence via Node's built-in node:sqlite (no native deps).
 * Only ever accessed through repository interfaces — swapping this adapter
 * for the platform's real persistence requires no changes outside src/adapters.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  const dbPath = process.env.CI_DB_PATH ?? path.join(process.cwd(), "var", "poc.db");
  mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      source TEXT NOT NULL,
      state TEXT NOT NULL,
      title TEXT NOT NULL,
      video_json TEXT,
      score_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      state_history_json TEXT NOT NULL,
      rejection_json TEXT,
      analysis_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_opps_client_state ON opportunities (client_id, state);
    CREATE TABLE IF NOT EXISTS kb_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      opportunity_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      summary TEXT NOT NULL,
      reason TEXT,
      at TEXT NOT NULL
    );
  `);
  // Migration for stores created before Iteration 4
  try {
    db.exec("ALTER TABLE opportunities ADD COLUMN analysis_json TEXT");
  } catch {
    // column already exists
  }
  return db;
}

/** Test/seed helper: wipe all rows (schema stays). */
export function resetDb(): void {
  const d = getDb();
  d.exec("DELETE FROM opportunities; DELETE FROM kb_decisions;");
}
