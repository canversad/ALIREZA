/**
 * FIXTURE: SPH Auto Parts' previously published content with performance.
 * Stand-in for the platform's content history; replaced by a real
 * PublishedContentPort adapter at integration time.
 */
import type { PublishedContent } from "@/core/domain/types";
import type { PublishedContentPort } from "@/core/ports";

function iso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString();
}

const sphPublished: PublishedContent[] = [
  {
    id: "pub-brake-myths",
    clientId: "sph-auto-parts",
    title: "5 brake myths our counter hears every week",
    platform: "tiktok",
    publishedAt: iso(41),
    tags: ["brake", "myth", "auto parts"],
    performance: { views: 48_000, vsAccountAverage: 3.12 },
  },
  {
    id: "pub-may-savings",
    clientId: "sph-auto-parts",
    title: "How Maria saved $380 on her water pump (real receipt)",
    platform: "tiktok",
    publishedAt: iso(55),
    tags: ["savings", "dealer", "diy repair"],
    performance: { views: 61_000, vsAccountAverage: 2.12 },
  },
  {
    id: "pub-winter-tires",
    clientId: "sph-auto-parts",
    title: "When to swap winter tires in the GTA (the honest answer)",
    platform: "youtube",
    publishedAt: iso(96),
    tags: ["tires", "toronto", "winter"],
    performance: { views: 12_500, vsAccountAverage: 1.35 },
  },
  {
    id: "pub-oil-guide",
    clientId: "sph-auto-parts",
    title: "Which oil filter tier is actually worth it",
    platform: "tiktok",
    publishedAt: iso(70),
    tags: ["oil", "filters", "buying guide"],
    performance: { views: 22_000, vsAccountAverage: 1.02 },
  },
  {
    id: "pub-counter-qa",
    clientId: "sph-auto-parts",
    title: "Ask the counter: your suspension questions answered",
    platform: "youtube",
    publishedAt: iso(120),
    tags: ["suspension", "counter", "diagnosis"],
    performance: { views: 8_900, vsAccountAverage: 0.78 },
  },
];

export class FixturePublishedContentPort implements PublishedContentPort {
  async listByClient(clientId: string): Promise<PublishedContent[]> {
    return sphPublished.filter((p) => p.clientId === clientId);
  }
}
