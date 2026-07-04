"use client";

/**
 * The four "next obvious actions" on every card: Watch · Analyze · Shortlist · Reject.
 * Reject opens an inline reason picker (no modal, no navigation) — reasons feed
 * the learning signal. All decisions are reversible from their tab.
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  rejectOpportunity,
  reopenOpportunity,
  shortlistOpportunity,
} from "@/app/actions";
import type { Opportunity, RejectionReason } from "@/core/domain/types";

const REJECT_REASONS: { value: RejectionReason; label: string }[] = [
  { value: "off-brand", label: "Off-brand" },
  { value: "cannot-produce", label: "Can’t produce" },
  { value: "seen-it", label: "Seen it" },
  { value: "wrong-audience", label: "Wrong audience" },
  { value: "other", label: "Other" },
];

const btn =
  "rounded-full px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

export function CardActions({
  opportunity,
  hideAnalyze = false,
}: {
  opportunity: Opportunity;
  /** On the detail page itself the Analyze link would self-reference. */
  hideAnalyze?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const o = opportunity;
  const watchable = o.video && o.video.provenance !== "fixture";

  return (
    <div className="relative flex flex-wrap items-center gap-1.5" data-testid="card-actions">
      {watchable ? (
        <a
          href={o.video!.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} border border-stone-300 text-stone-700 hover:border-stone-500`}
        >
          Watch ↗
        </a>
      ) : (
        <button
          disabled
          title="Fixture video — no playable URL. Real providers supply working links."
          className={`${btn} border border-stone-200 text-stone-400`}
        >
          Watch ↗
        </button>
      )}

      {!hideAnalyze && (
        <Link
          href={`/opportunity/${encodeURIComponent(o.id)}`}
          className={`${btn} border border-stone-300 text-stone-700 hover:border-stone-500`}
        >
          Analyze →
        </Link>
      )}

      {o.state === "discovered" && (
        <>
          <button
            data-testid="action-shortlist"
            disabled={pending}
            onClick={() => startTransition(() => shortlistOpportunity(o.id, o.clientId))}
            className={`${btn} bg-stone-900 text-white hover:bg-stone-700`}
          >
            ★ Shortlist
          </button>
          <button
            data-testid="action-reject"
            disabled={pending}
            onClick={() => setRejectOpen((v) => !v)}
            className={`${btn} border border-stone-300 text-stone-600 hover:border-red-400 hover:text-red-700`}
          >
            Reject ▾
          </button>
          {rejectOpen && (
            <div
              data-testid="reject-menu"
              className="absolute right-0 top-8 z-10 w-44 rounded-xl border border-stone-200 bg-white p-1 shadow-lg"
            >
              {REJECT_REASONS.map((r) => (
                <button
                  key={r.value}
                  data-testid={`reject-${r.value}`}
                  disabled={pending}
                  onClick={() => {
                    setRejectOpen(false);
                    startTransition(() => rejectOpportunity(o.id, o.clientId, r.value));
                  }}
                  className="block w-full rounded-lg px-3 py-1.5 text-left text-xs text-stone-700 hover:bg-stone-100"
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {o.state === "shortlisted" && (
        <button
          data-testid="action-unshortlist"
          disabled={pending}
          onClick={() => startTransition(() => reopenOpportunity(o.id, o.clientId))}
          className={`${btn} border border-stone-300 text-stone-600 hover:border-stone-500`}
          title="Remove from shortlist (back to Inbox)"
        >
          Remove ★
        </button>
      )}

      {o.state === "rejected" && (
        <button
          data-testid="action-reopen"
          disabled={pending}
          onClick={() => startTransition(() => reopenOpportunity(o.id, o.clientId))}
          className={`${btn} border border-stone-300 text-stone-600 hover:border-stone-500`}
        >
          Reopen
        </button>
      )}
    </div>
  );
}
