/**
 * Dossier sections for the Opportunity Detail page — each a self-contained
 * server component fed from the OpportunityDossier. One export per section;
 * the page's SECTION registry decides order and presence.
 */
import Link from "next/link";
import type { OpportunityDossier } from "@/core/services/dossier";
import type { StateTransition } from "@/core/domain/types";
import {
  PLATFORM_ICON,
  PLATFORM_LABEL,
  confidenceForProvenance,
  daysAgoLabel,
  durationLabel,
  formatCount,
} from "@/lib/format";
import { SectionEmpty } from "./DetailSection";

const dt = (iso: string) => new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";

/* 1 ─ Complete metric evidence */
export function MetricEvidence({ d }: { d: OpportunityDossier }) {
  const v = d.opportunity.video;
  if (!v) return <SectionEmpty>No video evidence (original-idea opportunity).</SectionEmpty>;
  const conf = confidenceForProvenance(v.provenance);
  const m = v.metrics;
  const cells: [string, string][] = [
    ["Views", formatCount(m.views)],
    ["Likes", formatCount(m.likes)],
    ["Comments", formatCount(m.comments)],
    ["Shares", formatCount(m.shares)],
    ["Engagement rate", `${(m.engagementRate * 100).toFixed(1)}%`],
    ["Vs creator baseline", `${Math.round(m.overperformance)}×`],
  ];
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cells.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-stone-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-stone-400">{label}</p>
            <p className="text-lg font-bold text-stone-900">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-stone-500">
        Engagement = (likes + comments + shares) ÷ views. Baseline = views ÷ creator followers (
        {formatCount(v.creator.followerCount)} for {v.creator.displayName}).
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600">
        <span>
          {PLATFORM_ICON[v.platform]} {PLATFORM_LABEL[v.platform]}
        </span>
        <span>published {daysAgoLabel(v.publishedAt)}</span>
        <span>{durationLabel(v.durationSec)}</span>
        <span>format: {v.format}</span>
        {v.language && <span>lang: {v.language.toUpperCase()}</span>}
        {v.region && <span>region: {v.region}</span>}
        <span
          title={conf.title}
          className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-800"
        >
          {v.provenance} · {conf.label}
        </span>
        <span data-testid="fetched-at">fetched {dt(v.fetchedAt)}</span>
      </p>
      <p className="mt-1 break-all text-xs text-stone-400">source: {v.url}</p>
    </div>
  );
}

/* 2 ─ Score anatomy */
const WEIGHTS: { key: "virality" | "brandFit" | "adaptability" | "freshness"; label: string; pct: string }[] = [
  { key: "virality", label: "Virality", pct: "40%" },
  { key: "brandFit", label: "Brand fit", pct: "25%" },
  { key: "adaptability", label: "Production ease", pct: "20%" },
  { key: "freshness", label: "Freshness / locality", pct: "15%" },
];

export function ScoreAnatomy({ d }: { d: OpportunityDossier }) {
  const s = d.opportunity.score;
  return (
    <div>
      <p className="mb-3 text-sm">
        <span className="rounded-xl bg-stone-900 px-2.5 py-1 text-base font-bold text-white">
          {Math.round(s.total)}
        </span>{" "}
        <span className="text-stone-500">/ 100 base score</span>
        {s.hot && (
          <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-700">
            HOT
          </span>
        )}
      </p>
      <ul className="space-y-2.5">
        {WEIGHTS.map(({ key, label, pct }) => {
          const comp = s[key];
          return (
            <li key={key}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-stone-700">
                  {label} <span className="text-stone-400">(weight {pct})</span>
                </span>
                <span className="text-stone-500">{Math.round(comp.value * 100)}/100</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-stone-100">
                <div
                  className="h-1.5 rounded-full bg-stone-700"
                  style={{ width: `${Math.round(comp.value * 100)}%` }}
                />
              </div>
              <p className="mt-0.5 text-xs text-stone-500">{comp.reason}</p>
            </li>
          );
        })}
      </ul>
      {d.adjustment && (
        <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Current learning adjustment: <strong>−{d.adjustment.penalty}</strong> ({d.adjustment.why}).
          Applies to feed ranking only — the base score above is frozen at scoring time.
        </p>
      )}
    </div>
  );
}

/* 3 ─ Decision history */
function transitionLabel(t: StateTransition): string {
  if (t.from === t.to && t.from === "discovered") return "harvested into the feed";
  if (t.note === "reopened") return `reopened (${t.from} → ${t.to})`;
  return `${t.from} → ${t.to}`;
}

export function DecisionHistory({ d }: { d: OpportunityDossier }) {
  const history = d.opportunity.stateHistory;
  return (
    <ol className="space-y-2">
      {history.map((t, i) => (
        <li key={i} className="flex items-baseline gap-3 text-sm">
          <span className="w-32 shrink-0 text-xs text-stone-400">{dt(t.at)}</span>
          <span className="font-medium text-stone-800">{transitionLabel(t)}</span>
          <span className="text-xs text-stone-500">by {t.by}</span>
          {t.note && t.note !== "reopened" && (
            <span className="text-xs italic text-stone-400">“{t.note}”</span>
          )}
        </li>
      ))}
    </ol>
  );
}

/* 4 ─ Human approvals (the three gates) */
const GATES: { to: string; label: string; who: string }[] = [
  { to: "shortlisted", label: "A1 · Shortlist (curation)", who: "strategist" },
  { to: "approved", label: "A2 · Brief approval (editorial)", who: "strategist" },
  { to: "planned", label: "A3 · Client approval (Meeting Mode)", who: "client" },
];

export function Approvals({ d }: { d: OpportunityDossier }) {
  const history = d.opportunity.stateHistory;
  return (
    <ul className="space-y-2">
      {GATES.map((g) => {
        const hit = [...history].reverse().find((t) => t.to === g.to && t.from !== t.to);
        return (
          <li key={g.to} className="flex items-center gap-3 text-sm" data-gate={g.to}>
            <span
              className={
                hit
                  ? "flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white"
                  : "flex h-5 w-5 items-center justify-center rounded-full border border-stone-300 text-[11px] text-stone-300"
              }
            >
              {hit ? "✓" : "·"}
            </span>
            <span className={hit ? "font-medium text-stone-800" : "text-stone-400"}>{g.label}</span>
            {hit ? (
              <span className="text-xs text-stone-500">
                passed {dt(hit.at)} by {hit.by}
              </span>
            ) : (
              <span className="text-xs text-stone-400">not reached yet (gate held by {g.who})</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* 5 ─ Rejection history */
export function RejectionHistory({ d }: { d: OpportunityDossier }) {
  const o = d.opportunity;
  const rejections = o.stateHistory.filter((t) => t.to === "rejected");
  if (rejections.length === 0 && !o.rejection) {
    return <SectionEmpty>Never rejected.</SectionEmpty>;
  }
  return (
    <div className="space-y-2">
      {o.rejection && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Currently rejected: <strong>{o.rejection.reason}</strong> by {o.rejection.by},{" "}
          {dt(o.rejection.at)}
        </p>
      )}
      {rejections.map((t, i) => (
        <p key={i} className="text-sm text-stone-600">
          {dt(t.at)} — rejected by {t.by}
          {o.state !== "rejected" && (
            <span className="ml-2 text-xs text-stone-400">(later reopened)</span>
          )}
        </p>
      ))}
    </div>
  );
}

/* 6 ─ Knowledge Base references */
export function KbReferences({ d }: { d: OpportunityDossier }) {
  if (d.kbDecisions.length === 0) {
    return <SectionEmpty>No Knowledge Base entries reference this opportunity yet.</SectionEmpty>;
  }
  return (
    <ul className="space-y-2">
      {d.kbDecisions.map((k, i) => (
        <li key={i} className="rounded-xl bg-stone-50 px-3 py-2 text-sm">
          <span className="mr-2 rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-medium uppercase text-stone-600">
            {k.kind}
          </span>
          <span className="text-stone-800">{k.summary}</span>
          {k.reason && <span className="ml-2 text-xs text-stone-500">reason: {k.reason}</span>}
          <span className="ml-2 text-xs text-stone-400">{dt(k.at)}</span>
        </li>
      ))}
    </ul>
  );
}

/* 7 ─ Brand DNA references */
function ChipRow({ label, items, tone }: { label: string; items: string[]; tone: "ok" | "warn" }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-1.5">
      <span className="text-xs font-medium text-stone-500">{label}:</span>
      {items.map((t) => (
        <span
          key={t}
          className={
            tone === "warn"
              ? "rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[11px] text-red-800"
              : "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800"
          }
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export function BrandDnaRefs({ d }: { d: OpportunityDossier }) {
  const f = d.brandFit;
  const none =
    f.nicheMatches.length + f.productMatches.length + f.traitMatches.length + f.guardrailConflicts.length === 0;
  return (
    <div className="space-y-2">
      {f.guardrailConflicts.length > 0 && (
        <p
          data-testid="guardrail-conflict"
          className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
        >
          ⚠ Guardrail conflict — Brand DNA excludes: {f.guardrailConflicts.join(", ")}
        </p>
      )}
      <ChipRow label="Niche keywords" items={f.nicheMatches} tone="ok" />
      <ChipRow label="Product lines" items={f.productMatches} tone="ok" />
      <ChipRow label="Brand traits" items={f.traitMatches} tone="ok" />
      {none && <SectionEmpty>No direct Brand DNA matches — scored as niche-adjacent.</SectionEmpty>}
      <p className="mt-2 border-t border-stone-100 pt-2 text-xs text-stone-500">
        Brand DNA (read-only): tone “{d.brandDna.tone}” · audience: {d.brandDna.audience}
      </p>
    </div>
  );
}

/* 8 ─ Similar past opportunities */
const STATE_COLORS: Record<string, string> = {
  discovered: "bg-stone-100 text-stone-600",
  shortlisted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  briefed: "bg-sky-100 text-sky-800",
  approved: "bg-emerald-100 text-emerald-800",
  pitched: "bg-violet-100 text-violet-800",
  planned: "bg-stone-900 text-white",
  analyzed: "bg-sky-100 text-sky-800",
};

export function SimilarOpportunities({ d }: { d: OpportunityDossier }) {
  if (d.similar.length === 0) {
    return <SectionEmpty>No similar opportunities for this client yet.</SectionEmpty>;
  }
  return (
    <ul className="space-y-2">
      {d.similar.map(({ opportunity: o, overlap }) => (
        <li key={o.id} className="flex flex-wrap items-center gap-2 text-sm">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATE_COLORS[o.state]}`}>
            {o.state}
          </span>
          <Link
            href={`/opportunity/${encodeURIComponent(o.id)}`}
            className="font-medium text-stone-800 hover:underline"
            data-testid="similar-link"
          >
            {o.title}
          </Link>
          <span className="text-xs text-stone-400">
            score {Math.round(o.score.total)} · shared: {overlap.traits.join(" · ")}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* 9 ─ Related previously published content */
export function RelatedPublishedContent({ d }: { d: OpportunityDossier }) {
  if (d.relatedPublished.length === 0) {
    return (
      <SectionEmpty>
        No previously published client content overlaps with this opportunity.
      </SectionEmpty>
    );
  }
  return (
    <ul className="space-y-2">
      {d.relatedPublished.map(({ content: p, sharedTags }) => {
        const delta = Math.round((p.performance.vsAccountAverage - 1) * 100);
        return (
          <li key={p.id} className="rounded-xl bg-stone-50 px-3 py-2 text-sm">
            <p className="font-medium text-stone-800">{p.title}</p>
            <p className="mt-0.5 text-xs text-stone-500">
              {PLATFORM_ICON[p.platform]} {PLATFORM_LABEL[p.platform]} ·{" "}
              {daysAgoLabel(p.publishedAt)} · {formatCount(p.performance.views)} views ·{" "}
              <span className={delta >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
                {delta >= 0 ? "+" : ""}
                {delta}% vs account average
              </span>{" "}
              · shared: {sharedTags.join(", ")}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/* 10 ─ Future planner linkage */
export function PlannerLinkage({ d }: { d: OpportunityDossier }) {
  if (d.opportunity.state === "planned") {
    return (
      <p className="text-sm text-stone-800">
        Scheduled in the Content Planner. (Planner reference arrives with the Phase 3 adapter.)
      </p>
    );
  }
  return (
    <SectionEmpty>
      Not planned yet. When this opportunity passes client approval and is scheduled, the Content
      Planner reference will appear here (PlannerPort — Phase 3 stub adapter).
    </SectionEmpty>
  );
}

/* 11 ─ Deep AI analysis (engine arrives in Iteration 4) */
export function AiAnalysisSection({ d }: { d: OpportunityDossier }) {
  void d;
  return (
    <div>
      <SectionEmpty>
        Deep analysis has not been run for this opportunity. Analysis is on-demand and cached
        permanently once generated — it never runs on content nobody asked about.
      </SectionEmpty>
      <button
        disabled
        title="The Claude analysis engine arrives in Iteration 4"
        className="mt-3 cursor-not-allowed rounded-full border border-stone-200 px-4 py-1.5 text-sm font-medium text-stone-400"
        data-testid="run-analysis"
      >
        ✨ Run deep analysis — Iteration 4
      </button>
    </div>
  );
}
