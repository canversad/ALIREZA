import type { HubDigest } from "@/core/services/digest";

export function DigestPanel({ digest }: { digest: HubDigest }) {
  return (
    <section
      aria-label="Since your last visit"
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-stone-500">
        Since your last visit <span className="font-normal">({digest.windowLabel})</span>
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        <li className="flex items-baseline gap-2">
          <span className="text-lg">📈</span>
          <span data-testid="digest-new">
            <strong>{digest.newCount}</strong> new trend opportunities ·{" "}
            <strong>{digest.hotCount}</strong> marked{" "}
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
              HOT
            </span>{" "}
            (rising fast)
          </span>
        </li>
        <li className="flex items-baseline gap-2">
          <span className="text-lg">📍</span>
          <span data-testid="digest-local">
            {digest.localSignals.length} local signals:{" "}
            {digest.localSignals.map((s, i) => (
              <span key={s.label}>
                {i > 0 && ", "}
                <em>“{s.label}”</em>{" "}
                <span className="text-xs text-stone-500">({s.window})</span>
              </span>
            ))}
          </span>
        </li>
      </ul>
      {digest.hotPreviews.length > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Hottest right now
          </p>
          <ul className="mt-2 space-y-1.5">
            {digest.hotPreviews.map((h) => (
              <li key={h.id} className="text-sm" data-testid="hot-preview">
                <span className="mr-1.5">⚡</span>
                <span className="font-medium">{h.title}</span>{" "}
                <span className="text-stone-500">— {h.whyHere}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
