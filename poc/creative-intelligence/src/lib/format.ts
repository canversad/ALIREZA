/** Small display helpers shared across screens. */

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export function daysAgoLabel(iso: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function durationLabel(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
};

export const PLATFORM_ICON: Record<string, string> = {
  tiktok: "🎵",
  youtube: "▶️",
  instagram: "📸",
};

/** Confidence label derived from metric provenance (research: trust discipline). */
export function confidenceForProvenance(p: string): { label: string; title: string } {
  switch (p) {
    case "official-api":
      return { label: "high confidence", title: "Metrics from the platform's official API" };
    case "scraper":
      return { label: "est.", title: "Metrics from a commercial scraper — point-in-time estimate" };
    default:
      return { label: "demo data", title: "Fabricated fixture data for PoC testing" };
  }
}
