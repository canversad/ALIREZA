import type { HubDigest } from "@/core/services/digest";

const STAGE_LABELS: Record<string, string> = {
  discovered: "Discovered",
  shortlisted: "Shortlisted",
  analyzed: "Analyzed",
  briefed: "Briefed",
  approved: "Approved",
  pitched: "Pitched",
  planned: "Planned",
};

export function PipelineStrip({ pipeline }: { pipeline: HubDigest["pipeline"] }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
        Pipeline
      </h2>
      <ol className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
        {pipeline.map((p, i) => (
          <li key={p.stage} className="flex items-center gap-1">
            {i > 0 && <span className="mx-1 text-stone-300">→</span>}
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
            <span className={p.count > 0 ? "text-stone-700" : "text-stone-400"}>
              {STAGE_LABELS[p.stage]}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
