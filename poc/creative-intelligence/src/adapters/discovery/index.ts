/**
 * Discovery provider factory — the single decision point for which provider
 * the app harvests from. Mirrors the analysis-engine selection pattern.
 *
 * Selection order:
 *   1. CI_DISCOVERY_PROVIDER=fixture  → always fixtures (pins the regression
 *      suite to demo data even when real keys are present in .env).
 *   2. CI_DISCOVERY_PROVIDER=youtube  → force YouTube (fails loudly if no key).
 *   3. Otherwise: real providers for whichever API keys are present; fixtures
 *      only if none are configured (same "activate on key" rule as analysis).
 */
import type { DiscoveryProvider } from "@/core/ports";
import { FixtureDiscoveryProvider } from "../fixtures";
import { YouTubeDiscoveryProvider } from "./youtube";
import { CompositeDiscoveryProvider } from "./composite";

export function selectDiscoveryProvider(): DiscoveryProvider {
  const forced = process.env.CI_DISCOVERY_PROVIDER;

  if (forced === "fixture") return new FixtureDiscoveryProvider();
  if (forced === "youtube") return new YouTubeDiscoveryProvider();

  const real: DiscoveryProvider[] = [];
  if (process.env.YOUTUBE_API_KEY) real.push(new YouTubeDiscoveryProvider());
  // Next iteration: if (process.env.SCRAPECREATORS_API_KEY) real.push(new ScrapeCreatorsProvider());

  if (real.length === 0) return new FixtureDiscoveryProvider();
  return real.length === 1 ? real[0] : new CompositeDiscoveryProvider(real);
}
