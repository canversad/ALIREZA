import type { ScoreBreakdown } from "@/core/domain/types";
import type { LearningAdjustment } from "@/core/services/learning";

const CHIP_STYLES = {
  virality: "bg-violet-50 text-violet-800 border-violet-200",
  brandFit: "bg-emerald-50 text-emerald-800 border-emerald-200",
  adaptability: "bg-sky-50 text-sky-800 border-sky-200",
  freshness: "bg-stone-50 text-stone-700 border-stone-200",
} as const;

const CHIP_LABELS = {
  virality: "viral",
  brandFit: "brand fit",
  adaptability: "production",
  freshness: "fresh",
} as const;

function Chip({
  kind,
  reason,
  value,
}: {
  kind: keyof typeof CHIP_STYLES;
  reason: string;
  value: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-4 ${CHIP_STYLES[kind]}`}
      title={`${CHIP_LABELS[kind]} component: ${Math.round(value * 100)}/100`}
    >
      <strong className="font-semibold">{CHIP_LABELS[kind]}</strong> {reason}
    </span>
  );
}

/** The four score components with their plain-language reasons — never a bare number. */
export function ScoreChips({
  score,
  adjustment,
}: {
  score: ScoreBreakdown;
  adjustment?: LearningAdjustment;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" data-testid="score-chips">
      <Chip kind="virality" reason={score.virality.reason} value={score.virality.value} />
      <Chip kind="brandFit" reason={score.brandFit.reason} value={score.brandFit.value} />
      <Chip kind="adaptability" reason={score.adaptability.reason} value={score.adaptability.value} />
      <Chip kind="freshness" reason={score.freshness.reason} value={score.freshness.value} />
      {adjustment && (
        <span
          data-testid="learning-chip"
          className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] leading-4 text-amber-800"
          title="Learning signal from your past rejections — the base score is unchanged; this adjusts ranking only"
        >
          <strong className="font-semibold">−{adjustment.penalty}</strong> {adjustment.why}
        </span>
      )}
    </div>
  );
}
