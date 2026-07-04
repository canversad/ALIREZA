"use client";

/**
 * Agency-workflow filters (GET params → shareable URLs). Selects push a new
 * query string; tabs are links rendered by the page. Dropdowns only offer
 * values that exist in the data (facets).
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { RadarFilters } from "@/core/services/feed";
import type { VideoFormat } from "@/core/domain/types";

const sel =
  "rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-400";

export function FilterBar({
  filters,
  facets,
}: {
  filters: RadarFilters;
  facets: { formats: VideoFormat[]; languages: string[]; regions: string[] };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div
      data-testid="filter-bar"
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2 shadow-sm"
    >
      <label className="flex items-center gap-1 text-xs text-stone-500">
        Platform
        <select
          data-testid="filter-platform"
          className={sel}
          value={filters.platform ?? ""}
          onChange={(e) => setParam("platform", e.target.value)}
        >
          <option value="">all</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
        </select>
      </label>

      <label className="flex items-center gap-1 text-xs text-stone-500">
        Window
        <select
          data-testid="filter-window"
          className={sel}
          value={String(filters.windowDays)}
          onChange={(e) => setParam("window", e.target.value)}
        >
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
        </select>
      </label>

      <label className="flex items-center gap-1 text-xs text-stone-500">
        Relevance
        <select
          data-testid="filter-relevance"
          className={sel}
          value={filters.relevance ?? ""}
          onChange={(e) => setParam("relevance", e.target.value)}
        >
          <option value="">any</option>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
      </label>

      <label className="flex items-center gap-1 text-xs text-stone-500">
        Difficulty
        <select
          data-testid="filter-difficulty"
          className={sel}
          value={filters.difficulty ?? ""}
          onChange={(e) => setParam("difficulty", e.target.value)}
        >
          <option value="">any</option>
          <option value="easy">easy</option>
          <option value="moderate">moderate</option>
          <option value="heavy">heavy</option>
        </select>
      </label>

      <label className="flex items-center gap-1 text-xs text-stone-500">
        Format
        <select
          data-testid="filter-format"
          className={sel}
          value={filters.format ?? ""}
          onChange={(e) => setParam("format", e.target.value)}
        >
          <option value="">any</option>
          {facets.formats.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1 text-xs text-stone-500">
        Language
        <select
          data-testid="filter-language"
          className={sel}
          value={filters.language ?? ""}
          onChange={(e) => setParam("language", e.target.value)}
        >
          <option value="">any</option>
          {facets.languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1 text-xs text-stone-500">
        Region
        <select
          data-testid="filter-region"
          className={sel}
          value={filters.region ?? ""}
          onChange={(e) => setParam("region", e.target.value)}
          title="Only videos whose source exposes a region — many don't"
        >
          <option value="">any</option>
          {facets.regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <span className="mx-1 hidden h-4 w-px bg-stone-200 sm:block" />

      <label className="flex items-center gap-1 text-xs text-stone-500">
        Sort
        <select
          data-testid="filter-sort"
          className={sel}
          value={filters.sort}
          onChange={(e) => setParam("sort", e.target.value)}
        >
          <option value="score">Opportunity Score</option>
          <option value="views">raw views</option>
          <option value="newest">newest</option>
        </select>
      </label>
    </div>
  );
}
