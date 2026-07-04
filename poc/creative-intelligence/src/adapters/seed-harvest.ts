/**
 * The harvest routine: discovery provider → scoring → opportunity store.
 * In production this runs nightly per client; in the PoC it runs at seed time
 * (and later via a manual "refresh" action).
 */
import { computeScore } from "@/core/services/scoring";
import type { Opportunity } from "@/core/domain/types";
import type { Container } from "./container";

const WINDOW_DAYS = 30;

export async function runHarvest(c: Container): Promise<number> {
  const clients = await c.clients.list();
  let total = 0;
  for (const client of clients) {
    const brand = await c.brandDna.get(client.id);
    if (!brand) continue;
    const videos = await c.discovery.harvest({
      nicheKeywords: client.nicheKeywords,
      windowDays: WINDOW_DAYS,
    });
    const now = new Date();
    const opportunities: Opportunity[] = videos.map((video) => {
      const score = computeScore(video, brand, client, now);
      const id = `${client.id}:${c.discovery.id}:${hash(video.url)}`;
      const at = now.toISOString();
      return {
        id,
        clientId: client.id,
        source: "trend",
        title: video.title,
        state: "discovered",
        video,
        score,
        createdAt: at,
        updatedAt: at,
        stateHistory: [{ from: "discovered", to: "discovered", at, by: "system:harvest" }],
      };
    });
    await c.opportunities.saveMany(opportunities);
    total += opportunities.length;
  }
  return total;
}

/** Stable id from URL — dedupe key across repeated harvests. */
function hash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}
