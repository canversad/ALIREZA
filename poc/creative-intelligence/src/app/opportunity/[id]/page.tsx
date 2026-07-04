import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSeeded, getContainer } from "@/adapters/container";

export const dynamic = "force-dynamic";

/** Iteration 3 target: full Opportunity Detail with on-demand deep AI analysis. */
export default async function OpportunityDetailStub({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureSeeded();
  const opportunity = await getContainer().opportunities.get(decodeURIComponent(id));
  if (!opportunity) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-center">
      <div className="text-4xl">🔍</div>
      <h1 className="mt-3 text-xl font-bold">{opportunity.title}</h1>
      <p className="mt-3 text-stone-600">
        The Opportunity Detail screen ships in Iteration 3 — full evidence panel
        and on-demand deep AI analysis (“why it worked / how {opportunity.clientId === "sph-auto-parts" ? "SPH" : "this client"} does it”).
      </p>
      <Link
        href={`/radar/${opportunity.clientId}`}
        className="mt-6 inline-block rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white"
      >
        ← Back to Trend Radar
      </Link>
    </main>
  );
}
