import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSeeded, getContainer } from "@/adapters/container";
import {
  buildFeed,
  feedFacets,
  parseRadarFilters,
  type RadarTab,
} from "@/core/services/feed";
import { computeLearningAdjustments } from "@/core/services/learning";
import { FilterBar } from "@/components/radar/FilterBar";
import { OpportunityCard } from "@/components/radar/OpportunityCard";

export const dynamic = "force-dynamic";

const TABS: { key: RadarTab; label: string }[] = [
  { key: "inbox", label: "Inbox" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default async function TrendRadar({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ clientId }, sp] = await Promise.all([params, searchParams]);
  await ensureSeeded();
  const c = getContainer();

  const client = await c.clients.get(clientId);
  if (!client) notFound();

  const filters = parseRadarFilters(sp);
  const all = await c.opportunities.listByClient(client.id);
  const rejected = all.filter((o) => o.state === "rejected");
  const adjustments = computeLearningAdjustments(all, rejected);
  const feed = buildFeed(all, filters, adjustments);
  const facets = feedFacets(all);

  const tabCounts: Record<RadarTab, number> = {
    inbox: all.filter((o) => o.state === "discovered").length,
    shortlisted: all.filter((o) => o.state === "shortlisted").length,
    rejected: rejected.length,
    all: all.length,
  };

  const tabHref = (tab: RadarTab) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      const val = Array.isArray(v) ? v[0] : v;
      if (val && k !== "tab") p.set(k, val);
    }
    p.set("tab", tab);
    return `/radar/${client.id}?${p.toString()}`;
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            <Link href={`/hub/${client.id}`} className="hover:underline">
              {client.name}
            </Link>{" "}
            · Trend Radar
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            📡 Which videos are worth proposing this week?
          </h1>
        </div>
        <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
          fixture data
        </span>
      </header>

      {/* Tabs */}
      <nav className="mb-3 flex gap-1" aria-label="Curation state">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabHref(t.key)}
            data-testid={`tab-${t.key}`}
            className={
              filters.tab === t.key
                ? "rounded-full bg-stone-900 px-4 py-1.5 text-sm font-medium text-white"
                : "rounded-full px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-200"
            }
          >
            {t.label}{" "}
            <span className={filters.tab === t.key ? "text-stone-300" : "text-stone-400"}>
              {tabCounts[t.key]}
            </span>
          </Link>
        ))}
      </nav>

      <FilterBar filters={filters} facets={facets} />

      {/* Feed */}
      <section className="mt-4 space-y-3" aria-label="Opportunities" data-testid="feed">
        {feed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-sm text-stone-500">
            Nothing matches these filters
            {filters.tab === "inbox" && tabCounts.inbox === 0
              ? " — the inbox is clear. Nice work."
              : ". Widen the time window or clear a filter."}
          </div>
        ) : (
          feed.map((item, i) => (
            <OpportunityCard key={item.opportunity.id} item={item} rank={i + 1} />
          ))
        )}
      </section>

      <footer className="mt-6 text-xs text-stone-400">
        Ranked by Opportunity Score (virality · brand fit · production · freshness)
        {rejected.length > 0 &&
          ` — learning from ${rejected.length} rejection${rejected.length > 1 ? "s" : ""}`}
        . Every metric shows its provenance.
      </footer>
    </main>
  );
}
