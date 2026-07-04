import Link from "next/link";
import type { HubDigest } from "@/core/services/digest";

export function ModeDoors({
  clientId,
  digest,
}: {
  clientId: string;
  digest: HubDigest;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Link
        href={`/radar/${clientId}`}
        data-testid="door-radar"
        className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-400 hover:shadow"
      >
        <div className="text-2xl">📡</div>
        <h3 className="mt-2 font-semibold group-hover:underline">Trend Radar</h3>
        <p className="mt-1 text-sm text-stone-600">Ride what’s already working</p>
        <p className="mt-3 text-xs font-medium text-stone-500">
          {digest.newCount} new · {digest.hotCount} hot
        </p>
      </Link>

      <div
        data-testid="door-studio"
        className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5"
        aria-disabled="true"
      >
        <div className="text-2xl opacity-50">💡</div>
        <h3 className="mt-2 font-semibold text-stone-400">Idea Studio</h3>
        <p className="mt-1 text-sm text-stone-400">Create what’s uniquely yours</p>
        <p className="mt-3 text-xs font-medium text-stone-400">Phase 2</p>
      </div>

      <div
        data-testid="door-prep"
        className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5"
        aria-disabled="true"
      >
        <div className="text-2xl opacity-50">🗂️</div>
        <h3 className="mt-2 font-semibold text-stone-400">Meeting Prep</h3>
        <p className="mt-1 text-sm text-stone-400">Package this week’s pitch</p>
        <p className="mt-3 text-xs font-medium text-stone-400">Phase 2</p>
      </div>
    </div>
  );
}
