/**
 * Runs several discovery providers and merges their results, deduped by URL.
 * Adding ScrapeCreators (TikTok) next iteration is a one-line change here —
 * the harvester and UI never learn there's more than one provider.
 *
 * A single provider failing (quota, outage) degrades the harvest rather than
 * killing it: its error is logged and the others still contribute.
 */
import type { DiscoveryProvider } from "@/core/ports";
import type { VideoEvidence } from "@/core/domain/types";

export class CompositeDiscoveryProvider implements DiscoveryProvider {
  readonly id: string;

  constructor(private providers: DiscoveryProvider[]) {
    if (providers.length === 0) throw new Error("CompositeDiscoveryProvider needs at least one provider");
    this.id = providers.map((p) => p.id).join("+");
  }

  async harvest(input: { nicheKeywords: string[]; windowDays: number }): Promise<VideoEvidence[]> {
    const settled = await Promise.allSettled(this.providers.map((p) => p.harvest(input)));
    const byUrl = new Map<string, VideoEvidence>();
    settled.forEach((result, i) => {
      if (result.status === "fulfilled") {
        for (const v of result.value) if (!byUrl.has(v.url)) byUrl.set(v.url, v);
      } else {
        console.error(`[discovery] provider "${this.providers[i].id}" failed: ${result.reason}`);
      }
    });
    return [...byUrl.values()];
  }
}
