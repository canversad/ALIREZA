import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSeeded, getContainer } from "@/adapters/container";
import { buildHubDigest } from "@/core/services/digest";
import { DigestPanel } from "@/components/hub/DigestPanel";
import { ModeDoors } from "@/components/hub/ModeDoors";
import { PipelineStrip } from "@/components/hub/PipelineStrip";

export const dynamic = "force-dynamic";

export default async function ResearchHub({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await ensureSeeded();
  const c = getContainer();

  const client = await c.clients.get(clientId);
  if (!client) notFound();

  const [opportunities, counts] = await Promise.all([
    c.opportunities.listByClient(client.id),
    c.opportunities.countByState(client.id),
  ]);
  const sinceIso = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const newCount = await c.opportunities.countCreatedSince(client.id, sinceIso);
  const digest = buildHubDigest(client, opportunities, counts, newCount);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Creative Intelligence · Research Hub
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="mt-1 text-sm text-stone-600">
            {client.industry} · {client.location}
          </p>
        </div>
        <span
          className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
          title="This PoC runs on fabricated demo data. Real providers activate in later iterations."
        >
          fixture data
        </span>
      </header>

      <DigestPanel digest={digest} />

      <section className="mt-6" aria-label="Working modes">
        <ModeDoors clientId={client.id} digest={digest} />
      </section>

      <section className="mt-6" aria-label="Pipeline">
        <PipelineStrip pipeline={digest.pipeline} />
      </section>

      <footer className="mt-8 border-t border-stone-200 pt-4 text-xs text-stone-500">
        Keyword universe ({client.nicheKeywords.length} terms):{" "}
        {client.nicheKeywords.join(", ")} ·{" "}
        <Link href="#" className="cursor-not-allowed text-stone-400" aria-disabled>
          edit (later iteration)
        </Link>
      </footer>
    </main>
  );
}
