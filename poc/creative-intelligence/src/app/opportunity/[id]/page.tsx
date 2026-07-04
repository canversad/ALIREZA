import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ensureSeeded, getContainer } from "@/adapters/container";
import { assembleDossier, type OpportunityDossier } from "@/core/services/dossier";
import { CardActions } from "@/components/radar/CardActions";
import { DetailSection } from "@/components/detail/DetailSection";
import {
  AiAnalysisSection,
  Approvals,
  BrandDnaRefs,
  DecisionHistory,
  KbReferences,
  MetricEvidence,
  PlannerLinkage,
  RejectionHistory,
  RelatedPublishedContent,
  ScoreAnatomy,
  SimilarOpportunities,
} from "@/components/detail/sections";

export const dynamic = "force-dynamic";

/**
 * SECTION REGISTRY — the page's extension point.
 * Future sections (hook analysis, scenario extraction, content angles,
 * emotional triggers, suggested adaptation, production difficulty, estimated
 * cost, expected business value) are added here as one entry + one component.
 * The page layout never changes.
 */
const SECTIONS: { id: string; title: string; render: (d: OpportunityDossier) => ReactNode }[] = [
  { id: "metrics", title: "Metric evidence", render: (d) => <MetricEvidence d={d} /> },
  { id: "score", title: "Score anatomy", render: (d) => <ScoreAnatomy d={d} /> },
  { id: "analysis", title: "Deep AI analysis", render: (d) => <AiAnalysisSection d={d} /> },
  { id: "brand", title: "Brand DNA references", render: (d) => <BrandDnaRefs d={d} /> },
  { id: "similar", title: "Similar past opportunities", render: (d) => <SimilarOpportunities d={d} /> },
  { id: "published", title: "Related published content", render: (d) => <RelatedPublishedContent d={d} /> },
  { id: "decisions", title: "Decision history", render: (d) => <DecisionHistory d={d} /> },
  { id: "approvals", title: "Human approvals", render: (d) => <Approvals d={d} /> },
  { id: "rejections", title: "Rejection history", render: (d) => <RejectionHistory d={d} /> },
  { id: "kb", title: "Knowledge Base references", render: (d) => <KbReferences d={d} /> },
  { id: "planner", title: "Planner linkage", render: (d) => <PlannerLinkage d={d} /> },
];

const STATE_BADGE: Record<string, string> = {
  discovered: "bg-stone-100 text-stone-700",
  shortlisted: "bg-emerald-100 text-emerald-800",
  analyzed: "bg-sky-100 text-sky-800",
  briefed: "bg-sky-100 text-sky-800",
  approved: "bg-emerald-100 text-emerald-800",
  pitched: "bg-violet-100 text-violet-800",
  planned: "bg-stone-900 text-white",
  rejected: "bg-red-100 text-red-700",
};

export default async function OpportunityDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureSeeded();
  const dossier = await assembleDossier(getContainer(), decodeURIComponent(id));
  if (!dossier) notFound();
  const o = dossier.opportunity;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
          <Link href={`/hub/${o.clientId}`} className="hover:underline">
            {dossier.client.name}
          </Link>{" "}
          ·{" "}
          <Link href={`/radar/${o.clientId}`} className="hover:underline">
            Trend Radar
          </Link>{" "}
          · Opportunity
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold leading-snug tracking-tight">{o.title}</h1>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <span
            data-testid="detail-state"
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${STATE_BADGE[o.state]}`}
          >
            {o.state}
          </span>
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
            source: {o.source}
          </span>
          <span>created {o.createdAt.slice(0, 10)}</span>
          <span>· updated {o.updatedAt.slice(0, 10)}</span>
        </p>
        <div className="mt-3">
          <CardActions opportunity={o} hideAnalyze />
        </div>
        {/* On-page nav */}
        <nav
          aria-label="On this page"
          className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-stone-200 pt-3 text-xs"
        >
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="text-stone-500 hover:text-stone-900 hover:underline">
              {s.title}
            </a>
          ))}
        </nav>
      </header>

      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <DetailSection key={s.id} id={s.id} title={s.title}>
            {s.render(dossier)}
          </DetailSection>
        ))}
      </div>

      <footer className="mt-8 border-t border-stone-200 pt-4 text-xs text-stone-400">
        This page is the permanent decision record for this opportunity — every metric carries
        provenance, every decision carries an actor and timestamp.
      </footer>
    </main>
  );
}
