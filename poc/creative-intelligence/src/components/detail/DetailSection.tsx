import type { ReactNode } from "react";

/**
 * The shared shell every dossier section renders inside. Future sections
 * (hook analysis, scenario extraction, angles, emotional triggers, suggested
 * adaptation, production difficulty/cost, business value) reuse this shell and
 * register in the page's SECTION registry — the page itself never changes.
 */
export function DetailSection({
  id,
  title,
  badge,
  children,
}: {
  id: string;
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-testid={`section-${id}`}
      className="scroll-mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{title}</h2>
        {badge && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
            {badge}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

/** Consistent empty-state rendering inside a section. */
export function SectionEmpty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-stone-400">{children}</p>;
}
