import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSeeded, getContainer } from "@/adapters/container";

export const dynamic = "force-dynamic";

/** Iteration 2 target. Present now only so the hub's primary door has a live route. */
export default async function TrendRadarStub({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await ensureSeeded();
  const client = await getContainer().clients.get(clientId);
  if (!client) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-center">
      <div className="text-4xl">📡</div>
      <h1 className="mt-3 text-2xl font-bold">Trend Radar · {client.name}</h1>
      <p className="mt-3 text-stone-600">
        This screen ships in Iteration 2 — the ranked discovery feed with score
        chips, filters, shortlist and reject-with-reason actions.
      </p>
      <Link
        href={`/hub/${client.id}`}
        className="mt-6 inline-block rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white"
      >
        ← Back to Research Hub
      </Link>
    </main>
  );
}
