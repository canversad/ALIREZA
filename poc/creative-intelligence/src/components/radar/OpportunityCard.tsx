import type { FeedItem } from "@/core/services/feed";
import {
  PLATFORM_ICON,
  PLATFORM_LABEL,
  confidenceForProvenance,
  daysAgoLabel,
  durationLabel,
  formatCount,
} from "@/lib/format";
import { ScoreChips } from "./ScoreChips";
import { CardActions } from "./CardActions";

/**
 * One opportunity, decidable without opening it: full evidence row, the four
 * score-component chips with reasons, provenance/confidence badge, and the
 * four next actions.
 */
export function OpportunityCard({ item, rank }: { item: FeedItem; rank: number }) {
  const o = item.opportunity;
  const v = o.video;
  if (!v) return null;
  const conf = confidenceForProvenance(v.provenance);

  return (
    <article
      data-testid="opportunity-card"
      data-platform={v.platform}
      data-state={o.state}
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
    >
      <div className="flex gap-4">
        {/* Rank + adjusted score */}
        <div className="flex w-14 shrink-0 flex-col items-center pt-0.5">
          <span className="text-xs font-medium text-stone-400">#{rank}</span>
          <span
            data-testid="card-score"
            className="mt-1 rounded-xl bg-stone-900 px-2 py-1 text-sm font-bold text-white"
            title={
              item.adjustment
                ? `Base score ${o.score.total}, shown after −${item.adjustment.penalty} learning adjustment`
                : `Opportunity Score`
            }
          >
            {Math.round(item.adjustedTotal)}
          </span>
          {o.score.hot && o.state === "discovered" && (
            <span className="mt-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
              HOT
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Title line */}
          <h3 className="font-semibold leading-snug">{v.title}</h3>

          {/* Creator + platform + recency + provenance */}
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600">
            <span>
              {PLATFORM_ICON[v.platform]} {PLATFORM_LABEL[v.platform]}
            </span>
            <span className="font-medium text-stone-800">
              {v.creator.displayName}{" "}
              <span className="font-normal text-stone-500">
                ({formatCount(v.creator.followerCount)} followers)
              </span>
            </span>
            <span data-testid="card-published">{daysAgoLabel(v.publishedAt)}</span>
            <span>{durationLabel(v.durationSec)}</span>
            {v.language && <span className="uppercase">{v.language}</span>}
            {v.region && <span>· {v.region}</span>}
            <span
              data-testid="provenance-badge"
              title={conf.title}
              className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-800"
            >
              {v.provenance} · {conf.label}
            </span>
          </p>

          {/* Evidence row */}
          <p className="mt-2 text-sm text-stone-800" data-testid="card-evidence">
            <strong>{formatCount(v.metrics.views)}</strong> views ·{" "}
            {formatCount(v.metrics.likes)} likes · {formatCount(v.metrics.comments)} comments ·{" "}
            {formatCount(v.metrics.shares)} shares ·{" "}
            <strong>{(v.metrics.engagementRate * 100).toFixed(1)}%</strong> engagement ·{" "}
            <strong>{Math.round(v.metrics.overperformance)}×</strong> creator baseline
          </p>

          {/* Why ranked here */}
          <div className="mt-2">
            <ScoreChips score={o.score} adjustment={item.adjustment} />
          </div>

          {o.state === "rejected" && o.rejection && (
            <p className="mt-2 text-xs text-red-700" data-testid="card-rejection">
              Rejected: {o.rejection.reason}
            </p>
          )}

          {/* Actions */}
          <div className="mt-3">
            <CardActions opportunity={o} />
          </div>
        </div>
      </div>
    </article>
  );
}
