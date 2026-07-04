import Link from "next/link";
import type { HubDigest } from "@/core/services/digest";

/** Stages with a live Radar tab to jump into. */
const STAGE_LINKS: Record<string, string> = {
  discovered: "inbox",
  shortlisted: "shortlisted",
};

const STAGE_LABELS: Record<string, string> = {
  discovered: "Discovered",
  shortlisted: "Shortlisted",
  analyzed: "Analyzed",
  briefed: "Briefed",
  approved: "Approved",
  pitched: "Pitched",
  planned: "Planned",
};

export function PipelineStrip({
  pipeline,
  clientId,
}: {
  pipeline: HubDigest["pipeline"];
  clientId: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
        Pipeline
      </h2>
      <ol className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
        {pipeline.map((p, i) => (
          <li key={p.stage} className="flex items-center gap-1">
            {i > 0 && <span className="mx-1 text-stone-300">→</span>}
            {(() => {
              const chip = (
                <span
                  data-testid={`pipeline-${p.stage}`}
                  className={
                    p.count > 0
                      ? "rounded-full bg-stone-900 px-2.5 py-0.5 font-medium text-white"
                      : "rounded-full bg-stone-100 px-2.5 py-0.5 text-stone-400"
                  }
                >
                  {p.count}
                </span>
              );
              const label = (
                <span className={p.count > 0 ? "text-stone-700" : "text-stone-400"}>
                  {STAGE_LABELS[p.stage]}
                </span>
              );
              const tab = STAGE_LINKS[p.stage];
              return tab ? (
                <Link
                  href={`/radar/${clientId}?tab=${tab}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  {chip}
                  {label}
                </Link>
              ) : (
                <span className="flex items-center gap-1">
                  {chip}
                  {label}
                </span>
              );
            })()}
          </li>
        ))}
      </ol>
    </div>
  );
}
