/**
 * Fixture adapters: stand-ins for the real platform (Brand DNA, clients) and
 * for real discovery providers. Swapped out via the container, never imported
 * by core.
 */
import type {
  BrandDNAPort,
  ClientPort,
  DiscoveryProvider,
} from "@/core/ports";
import type { BrandDNA, ClientProfile, VideoEvidence } from "@/core/domain/types";
import { sphBrandDNA, sphClient, sphFixtureVideos } from "./sph-auto-parts";

export class FixtureClientPort implements ClientPort {
  private clients: ClientProfile[] = [sphClient];

  async list(): Promise<ClientProfile[]> {
    return this.clients;
  }

  async get(clientId: string): Promise<ClientProfile | null> {
    return this.clients.find((c) => c.id === clientId) ?? null;
  }
}

export class FixtureBrandDNAPort implements BrandDNAPort {
  private byClient: Record<string, BrandDNA> = { [sphBrandDNA.clientId]: sphBrandDNA };

  async get(clientId: string): Promise<BrandDNA | null> {
    return this.byClient[clientId] ?? null;
  }
}

/**
 * Fixture discovery provider. Same interface the ScrapeCreators / YouTube
 * Data API adapters will implement in later iterations.
 */
export class FixtureDiscoveryProvider implements DiscoveryProvider {
  readonly id = "fixture";

  async harvest(input: {
    nicheKeywords: string[];
    windowDays: number;
  }): Promise<VideoEvidence[]> {
    const now = new Date();
    const cutoff = now.getTime() - input.windowDays * 86_400_000;
    return sphFixtureVideos(now).filter(
      (v) => new Date(v.publishedAt).getTime() >= cutoff,
    );
  }
}
