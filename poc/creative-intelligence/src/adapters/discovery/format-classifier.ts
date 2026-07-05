/**
 * Best-guess VideoFormat from a real video's title/description/duration.
 *
 * Fixture videos carried hand-labeled formats; real API results don't. Rather
 * than fake that precision, we classify on keyword signals and fall back to
 * "unclassified" honestly — the scorer treats that as a neutral midpoint.
 */
import type { VideoFormat } from "@/core/domain/types";

const SIGNALS: { format: VideoFormat; terms: RegExp }[] = [
  { format: "myth-bust", terms: /\b(myth|debunk|stop (doing|buying)|don'?t (do|buy)|actually|truth about|lie)\b/i },
  { format: "before-after", terms: /\b(before|after|\d+[ ,]?\d*\s?(km|miles|k miles)|vs\.?|versus|teardown|inside a)\b/i },
  { format: "checklist", terms: /\b(\d+\s+(things|checks|tips|steps|ways|reasons)|checklist|before (any|your))\b/i },
  { format: "counter-demo", terms: /\b(how to|counter|parts? (store|counter)|install|replace|fix|diy)\b/i },
  { format: "reaction", terms: /\b(react|reacts|rating|ranking|tier list|reviewing)\b/i },
  { format: "pov-skit", terms: /\b(pov|when (you|your)|things (customers|people)|be like)\b/i },
  { format: "vlog-tour", terms: /\b(day in the life|vlog|behind the scenes|shop (life|tour)|a day at)\b/i },
];

export function classifyFormat(input: {
  title: string;
  description?: string;
  durationSec: number;
}): VideoFormat {
  const text = `${input.title} ${input.description ?? ""}`;
  for (const { format, terms } of SIGNALS) {
    if (terms.test(text)) return format;
  }
  // Long-form with production cues → cinematic build; otherwise honestly unknown.
  if (input.durationSec > 480 && /\b(build|restoration|rebuild|project)\b/i.test(text)) {
    return "cinematic-build";
  }
  return "unclassified";
}

/** Parse an ISO 8601 duration (e.g. "PT5M33S", "PT1H2M") into seconds. */
export function parseIsoDuration(iso: string): number {
  const m = /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!m) return 0;
  const [, d, h, min, s] = m;
  return (Number(d ?? 0) * 86400) + (Number(h ?? 0) * 3600) + (Number(min ?? 0) * 60) + Number(s ?? 0);
}
