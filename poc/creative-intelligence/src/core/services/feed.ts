/**
 * Trend Radar feed logic: filters, tiers, sorting. Pure functions — the page
 * stays thin and this stays unit-testable.
 */
import type { Opportunity, Platform, VideoFormat } from "../domain/types";
import type { LearningAdjustment } from "./learning";

export type RelevanceTier = "high" | "medium" | "low";
export type DifficultyTier = "easy" | "moderate" | "heavy";
export type RadarTab = "inbox" | "shortlisted" | "rejected" | "all";
export type RadarSort = "score" | "views" | "newest";

export interface RadarFilters {
  tab: RadarTab;
  sort: RadarSort;
  platform?: Platform;
  windowDays: 7 | 14 | 30;
  relevance?: RelevanceTier;
  difficulty?: DifficultyTier;
  format?: VideoFormat;
  language?: string;
  region?: string;
}

export const DEFAULT_FILTERS: RadarFilters = { tab: "inbox", sort: "score", windowDays: 30 };

/** Business relevance tier from the brand-fit score component. */
export function relevanceTier(brandFitValue: number): RelevanceTier {
  if (brandFitValue >= 0.6) return "high";
  if (brandFitValue >= 0.35) return "medium";
  return "low";
}

/** Difficulty-to-reproduce tier from the adaptability score component (inverted). */
export function difficultyTier(adaptabilityValue: number): DifficultyTier {
  if (adaptabilityValue >= 0.8) return "easy";
  if (adaptabilityValue >= 0.5) return "moderate";
  return "heavy";
}

export function parseRadarFilters(
  sp: Record<string, string | string[] | undefined>,
): RadarFilters {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;
  const windowRaw = Number(one("window"));
  return {
    tab: (["inbox", "shortlisted", "rejected", "all"].includes(one("tab") ?? "")
      ? one("tab")
      : "inbox") as RadarTab,
    sort: (["score", "views", "newest"].includes(one("sort") ?? "")
      ? one("sort")
      : "score") as RadarSort,
    platform: (["tiktok", "youtube", "instagram"].includes(one("platform") ?? "")
      ? one("platform")
      : undefined) as Platform | undefined,
    windowDays: ([7, 14, 30].includes(windowRaw) ? windowRaw : 30) as 7 | 14 | 30,
    relevance: (["high", "medium", "low"].includes(one("relevance") ?? "")
      ? one("relevance")
      : undefined) as RelevanceTier | undefined,
    difficulty: (["easy", "moderate", "heavy"].includes(one("difficulty") ?? "")
      ? one("difficulty")
      : undefined) as DifficultyTier | undefined,
    format: one("format") as VideoFormat | undefined,
    language: one("language") || undefined,
    region: one("region") || undefined,
  };
}

export interface FeedItem {
  opportunity: Opportunity;
  /** Score after the (visible) learning adjustment; equals score.total when none. */
  adjustedTotal: number;
  adjustment?: LearningAdjustment;
}

const TAB_STATES: Record<RadarTab, (state: Opportunity["state"]) => boolean> = {
  inbox: (s) => s === "discovered",
  shortlisted: (s) => s === "shortlisted",
  rejected: (s) => s === "rejected",
  all: () => true,
};

export function buildFeed(
  opportunities: Opportunity[],
  filters: RadarFilters,
  adjustments: Map<string, LearningAdjustment>,
  now: Date = new Date(),
): FeedItem[] {
  const cutoff = now.getTime() - filters.windowDays * 86_400_000;

  const items = opportunities
    .filter((o) => {
      const v = o.video;
      if (!v) return false;
      if (!TAB_STATES[filters.tab](o.state)) return false;
      if (new Date(v.publishedAt).getTime() < cutoff) return false;
      if (filters.platform && v.platform !== filters.platform) return false;
      if (filters.relevance && relevanceTier(o.score.brandFit.value) !== filters.relevance)
        return false;
      if (filters.difficulty && difficultyTier(o.score.adaptability.value) !== filters.difficulty)
        return false;
      if (filters.format && v.format !== filters.format) return false;
      if (filters.language && v.language !== filters.language) return false;
      if (filters.region && v.region !== filters.region) return false;
      return true;
    })
    .map((o) => {
      const adjustment = adjustments.get(o.id);
      const adjustedTotal = Math.max(0, o.score.total - (adjustment?.penalty ?? 0));
      return { opportunity: o, adjustedTotal, adjustment };
    });

  switch (filters.sort) {
    case "views":
      items.sort((a, b) => (b.opportunity.video?.metrics.views ?? 0) - (a.opportunity.video?.metrics.views ?? 0));
      break;
    case "newest":
      items.sort(
        (a, b) =>
          new Date(b.opportunity.video?.publishedAt ?? 0).getTime() -
          new Date(a.opportunity.video?.publishedAt ?? 0).getTime(),
      );
      break;
    default:
      items.sort((a, b) => b.adjustedTotal - a.adjustedTotal);
  }
  return items;
}

/** Distinct values present in the data — filter dropdowns never offer dead options. */
export function feedFacets(opportunities: Opportunity[]): {
  formats: VideoFormat[];
  languages: string[];
  regions: string[];
} {
  const formats = new Set<VideoFormat>();
  const languages = new Set<string>();
  const regions = new Set<string>();
  for (const o of opportunities) {
    if (!o.video) continue;
    formats.add(o.video.format);
    if (o.video.language) languages.add(o.video.language);
    if (o.video.region) regions.add(o.video.region);
  }
  return {
    formats: [...formats].sort(),
    languages: [...languages].sort(),
    regions: [...regions].sort(),
  };
}
