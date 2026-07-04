"use client";

import { useState, useTransition } from "react";
import { runDeepAnalysis } from "@/app/actions";

export function RunAnalysisButton({
  opportunityId,
  clientId,
  gated,
}: {
  opportunityId: string;
  clientId: string;
  /** True while the opportunity hasn't passed gate A1 (shortlist). */
  gated: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (gated) {
    return (
      <button
        disabled
        data-testid="run-analysis"
        title="Deep analysis runs only on shortlisted opportunities — cost follows curation (gate A1)"
        className="cursor-not-allowed rounded-full border border-stone-200 px-4 py-1.5 text-sm font-medium text-stone-400"
      >
        ✨ Run deep analysis — shortlist first
      </button>
    );
  }

  return (
    <div>
      <button
        data-testid="run-analysis"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await runDeepAnalysis(opportunityId, clientId);
            if (!result.ok) setError(result.error);
          });
        }}
        className="rounded-full bg-stone-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
      >
        {pending ? "Analyzing…" : "✨ Run deep analysis"}
      </button>
      {error && (
        <p data-testid="analysis-error" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
