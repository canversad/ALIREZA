/**
 * FIXTURE DATA — fabricated but realistic, modeled on the metric shapes
 * documented in research/viral-video-discovery.md. Every video here carries
 * provenance: "fixture" and the UI badges it accordingly. Replaced by real
 * harvester adapters (ScrapeCreators / YouTube Data API) in later iterations.
 */
import type {
  BrandDNA,
  ClientProfile,
  Creator,
  Platform,
  VideoEvidence,
  VideoFormat,
} from "@/core/domain/types";

export const sphClient: ClientProfile = {
  id: "sph-auto-parts",
  name: "SPH Auto Parts",
  industry: "Automotive Parts",
  location: "Toronto, ON",
  nicheKeywords: [
    "auto parts",
    "car parts",
    "brake",
    "mechanic",
    "oem",
    "aftermarket",
    "engine",
    "oil change",
    "suspension",
    "diy repair",
    "spark plug",
    "alternator",
  ],
  localSignals: [
    { label: "Canada Day weekend car meets (GTA)", kind: "local-event", window: "Jul 1–7" },
    { label: "Summer road-trip prep season", kind: "seasonal", window: "Jul–Aug" },
  ],
};

export const sphBrandDNA: BrandDNA = {
  clientId: "sph-auto-parts",
  traits: ["honest ally", "neighbourhood expert", "diy-friendly", "no upsell"],
  tone: "straight-talking, warm, a little wry — the counter guy who saves you money",
  audience: "GTA car owners 25–55; DIYers and independent shops",
  productLines: ["brakes", "filters", "batteries", "suspension", "oil", "spark plugs"],
  guardrails: ["street racing", "crash", "stunt", "insurance fraud", "rolling coal"],
};

/** Compact spec, expanded into full VideoEvidence at seed time. */
interface FixtureSpec {
  platform: Platform;
  title: string;
  handle: string;
  name: string;
  followers: number;
  daysAgo: number;
  views: number;
  engagement: number; // engagementRate
  durationSec: number;
  format: VideoFormat;
  tags: string[];
  language?: string;
  region?: string;
}

const specs: FixtureSpec[] = [
  { platform: "tiktok", title: "POV: the part your mechanic says you need vs the part you actually need", handle: "@torquetok", name: "TorqueTok", followers: 88_000, daysAgo: 4, views: 2_100_000, engagement: 0.094, durationSec: 34, format: "pov-skit", tags: ["mechanic", "auto parts", "upsell", "cartok"] },
  { platform: "youtube", title: "Brake pads: cheap vs OEM — what 60,000 km actually looks like", handle: "@dylansdiag", name: "Dylan's Diag", followers: 210_000, daysAgo: 11, views: 890_000, engagement: 0.061, durationSec: 58, format: "before-after", tags: ["brake", "oem", "aftermarket"] },
  { platform: "tiktok", title: "Counter guy rates the 5 parts people replace for no reason", handle: "@partscounterpete", name: "Parts Counter Pete", followers: 45_000, daysAgo: 2, views: 1_450_000, engagement: 0.088, durationSec: 41, format: "counter-demo", tags: ["auto parts", "myth", "diy repair"] },
  { platform: "tiktok", title: "Your alternator isn't dead. Do this 30-second test first", handle: "@wrenchwitch", name: "Wrench Witch", followers: 320_000, daysAgo: 6, views: 3_400_000, engagement: 0.071, durationSec: 29, format: "myth-bust", tags: ["alternator", "battery", "diy repair"] },
  { platform: "youtube", title: "I ran the cheapest oil filter on Amazon for 10,000 km", handle: "@projectfarmish", name: "Garage Verdict", followers: 1_400_000, daysAgo: 9, views: 2_800_000, engagement: 0.048, durationSec: 62, format: "before-after", tags: ["oil", "filters", "test"] },
  { platform: "tiktok", title: "Toronto mechanic explains why your winter rims are ruining summer", handle: "@sixsidegarage", name: "Six Side Garage (Toronto)", followers: 27_000, daysAgo: 5, views: 640_000, engagement: 0.102, durationSec: 44, format: "talking-head", tags: ["toronto", "rims", "suspension"] },
  { platform: "tiktok", title: "Rating customers' 'my car makes a noise' impressions", handle: "@shopdogsteve", name: "Shop Dog Steve", followers: 510_000, daysAgo: 13, views: 4_900_000, engagement: 0.083, durationSec: 38, format: "reaction", tags: ["mechanic", "funny", "diagnosis"] },
  { platform: "youtube", title: "5 checks before any road trip (15 minutes, zero tools)", handle: "@drivewaydoctor", name: "Driveway Doctor", followers: 96_000, daysAgo: 3, views: 410_000, engagement: 0.057, durationSec: 55, format: "checklist", tags: ["road trip", "summer", "canada", "maintenance"] },
  { platform: "tiktok", title: "The $40 fix dealers charge $400 for", handle: "@honestlugnut", name: "Honest Lugnut", followers: 150_000, daysAgo: 8, views: 5_600_000, engagement: 0.091, durationSec: 47, format: "counter-demo", tags: ["dealer", "savings", "diy repair", "brake"] },
  { platform: "tiktok", title: "Spark plug colours and what they're telling you", handle: "@wrenchwitch", name: "Wrench Witch", followers: 320_000, daysAgo: 16, views: 980_000, engagement: 0.064, durationSec: 33, format: "counter-demo", tags: ["spark plug", "engine", "diagnosis"] },
  { platform: "youtube", title: "Full suspension refresh on a 300k km Corolla — was it worth it?", handle: "@rustbeltrebuilds", name: "Rust Belt Rebuilds", followers: 730_000, daysAgo: 19, views: 1_200_000, engagement: 0.043, durationSec: 71, format: "before-after", tags: ["suspension", "corolla", "rebuild"] },
  { platform: "tiktok", title: "Things customers say at the parts counter (part 7)", handle: "@partscounterpete", name: "Parts Counter Pete", followers: 45_000, daysAgo: 21, views: 780_000, engagement: 0.079, durationSec: 36, format: "pov-skit", tags: ["auto parts", "funny", "counter"] },
  { platform: "tiktok", title: "Why the cheap brake pads squeal (and when that's fine)", handle: "@brakecheckbecca", name: "Brake Check Becca", followers: 62_000, daysAgo: 7, views: 1_950_000, engagement: 0.086, durationSec: 39, format: "myth-bust", tags: ["brake", "squeal", "aftermarket"] },
  { platform: "youtube", title: "Mechanic reacts to TikTok car 'hacks' that destroy engines", handle: "@dylansdiag", name: "Dylan's Diag", followers: 210_000, daysAgo: 24, views: 1_600_000, engagement: 0.052, durationSec: 66, format: "reaction", tags: ["engine", "hacks", "myth"] },
  { platform: "tiktok", title: "GTA pothole season vs your control arms", handle: "@sixsidegarage", name: "Six Side Garage (Toronto)", followers: 27_000, daysAgo: 12, views: 380_000, engagement: 0.097, durationSec: 42, format: "talking-head", tags: ["toronto", "pothole", "suspension", "ontario"] },
  { platform: "tiktok", title: "Battery died at -30? Here's what actually happened", handle: "@northwrench", name: "North Wrench", followers: 190_000, daysAgo: 27, views: 2_300_000, engagement: 0.059, durationSec: 31, format: "myth-bust", tags: ["battery", "winter", "canadian"] },
  { platform: "youtube", title: "Every fluid in your car, explained in 60 seconds", handle: "@drivewaydoctor", name: "Driveway Doctor", followers: 96_000, daysAgo: 15, views: 720_000, engagement: 0.055, durationSec: 59, format: "checklist", tags: ["fluids", "oil", "maintenance"] },
  { platform: "tiktok", title: "I let my apprentice do his first brake job — full send", handle: "@shopdogsteve", name: "Shop Dog Steve", followers: 510_000, daysAgo: 1, views: 2_700_000, engagement: 0.104, durationSec: 52, format: "vlog-tour", tags: ["brake", "apprentice", "shop life"] },
  { platform: "tiktok", title: "OEM vs aftermarket filters under a microscope", handle: "@honestlugnut", name: "Honest Lugnut", followers: 150_000, daysAgo: 18, views: 1_100_000, engagement: 0.067, durationSec: 45, format: "counter-demo", tags: ["oem", "aftermarket", "filters"] },
  { platform: "youtube", title: "Cinematic K24 engine build — 6 months in 12 minutes", handle: "@buildbaybros", name: "Build Bay Bros", followers: 2_100_000, daysAgo: 10, views: 3_900_000, engagement: 0.038, durationSec: 720, format: "cinematic-build", tags: ["engine", "build", "k24"] },
  { platform: "tiktok", title: "Stop paying for nitrogen in your tires. Please.", handle: "@wrenchwitch", name: "Wrench Witch", followers: 320_000, daysAgo: 3, views: 4_200_000, engagement: 0.089, durationSec: 27, format: "myth-bust", tags: ["tires", "nitrogen", "upsell", "myth"] },
  { platform: "tiktok", title: "Day in the life: parts delivery driver, downtown Toronto", handle: "@gtapartsrun", name: "GTA Parts Run", followers: 12_000, daysAgo: 6, views: 290_000, engagement: 0.112, durationSec: 48, format: "vlog-tour", tags: ["toronto", "auto parts", "delivery", "day in the life"] },
  { platform: "youtube", title: "The truth about lifetime transmission fluid", handle: "@garagetruths", name: "Garage Truths", followers: 480_000, daysAgo: 22, views: 950_000, engagement: 0.049, durationSec: 63, format: "talking-head", tags: ["transmission", "fluids", "myth"] },
  { platform: "tiktok", title: "Guessing what's wrong from the noise alone (customer edition)", handle: "@brakecheckbecca", name: "Brake Check Becca", followers: 62_000, daysAgo: 26, views: 830_000, engagement: 0.075, durationSec: 35, format: "reaction", tags: ["diagnosis", "noise", "funny"] },
  { platform: "tiktok", title: "3 parts you should always buy OEM (and 3 you shouldn't)", handle: "@partscounterpete", name: "Parts Counter Pete", followers: 45_000, daysAgo: 9, views: 2_050_000, engagement: 0.081, durationSec: 43, format: "counter-demo", tags: ["oem", "aftermarket", "auto parts", "buying guide"] },
  { platform: "youtube", title: "Why your AC smells like a gym bag (60-second fix)", handle: "@drivewaydoctor", name: "Driveway Doctor", followers: 96_000, daysAgo: 5, views: 530_000, engagement: 0.058, durationSec: 57, format: "counter-demo", tags: ["ac", "cabin filter", "summer"] },
  { platform: "tiktok", title: "Street takeover ends exactly how you'd expect", handle: "@clipfarmauto", name: "Clip Farm Auto", followers: 900_000, daysAgo: 4, views: 6_800_000, engagement: 0.055, durationSec: 24, format: "reaction", tags: ["street racing", "crash", "takeover"] },
  { platform: "tiktok", title: "How we saved a student $900 on her first brake job", handle: "@sixsidegarage", name: "Six Side Garage (Toronto)", followers: 27_000, daysAgo: 3, views: 510_000, engagement: 0.108, durationSec: 51, format: "talking-head", tags: ["toronto", "brake", "savings", "student"] },
  { platform: "youtube", title: "Ranking every oil brand at the parts store (tier list)", handle: "@garagetruths", name: "Garage Truths", followers: 480_000, daysAgo: 14, views: 1_750_000, engagement: 0.051, durationSec: 68, format: "reaction", tags: ["oil", "tier list", "brands"] },
  { platform: "tiktok", title: "The wheel bearing noise everyone ignores until it's $1200", handle: "@northwrench", name: "North Wrench", followers: 190_000, daysAgo: 20, views: 1_300_000, engagement: 0.062, durationSec: 37, format: "myth-bust", tags: ["wheel bearing", "diagnosis", "suspension"] },
  { platform: "tiktok", title: "Parts store scavenger hunt: build a beater kit for $100", handle: "@honestlugnut", name: "Honest Lugnut", followers: 150_000, daysAgo: 29, views: 940_000, engagement: 0.072, durationSec: 49, format: "checklist", tags: ["budget", "auto parts", "challenge"] },
  { platform: "youtube", title: "What's inside a $12 vs $120 shock absorber", handle: "@rustbeltrebuilds", name: "Rust Belt Rebuilds", followers: 730_000, daysAgo: 6, views: 2_200_000, engagement: 0.046, durationSec: 64, format: "before-after", tags: ["suspension", "shock", "teardown"] },
  { platform: "tiktok", title: "Reading your tires like a palm reader", handle: "@brakecheckbecca", name: "Brake Check Becca", followers: 62_000, daysAgo: 17, views: 690_000, engagement: 0.083, durationSec: 40, format: "counter-demo", tags: ["tires", "wear", "diagnosis"] },
  { platform: "tiktok", title: "Why Canadian cars rust from the inside out", handle: "@northwrench", name: "North Wrench", followers: 190_000, daysAgo: 8, views: 1_850_000, engagement: 0.066, durationSec: 36, format: "talking-head", tags: ["rust", "canada", "winter", "undercoating"] },
  { platform: "youtube", title: "I bought every 'engine restore' additive. One worked.", handle: "@projectfarmish", name: "Garage Verdict", followers: 1_400_000, daysAgo: 28, views: 3_100_000, engagement: 0.044, durationSec: 70, format: "before-after", tags: ["engine", "additive", "test"] },
  { platform: "tiktok", title: "Drive-thru oil change vs doing it yourself: real math", handle: "@torquetok", name: "TorqueTok", followers: 88_000, daysAgo: 15, views: 1_150_000, engagement: 0.077, durationSec: 46, format: "myth-bust", tags: ["oil change", "diy repair", "savings"] },
  { platform: "tiktok", title: "The one tool every glovebox needs (it's $9)", handle: "@drivewaydoctor", name: "Driveway Doctor", followers: 96_000, daysAgo: 25, views: 2_600_000, engagement: 0.068, durationSec: 30, format: "counter-demo", tags: ["tools", "safety", "budget"] },
  { platform: "tiktok", title: "Pièces d'origine ou aftermarket? Un mécano de Montréal tranche", handle: "@garagemtl", name: "Garage MTL", followers: 54_000, daysAgo: 7, views: 460_000, engagement: 0.084, durationSec: 43, format: "talking-head", tags: ["oem", "aftermarket", "montreal", "quebec"], language: "fr", region: "CA" },
  { platform: "tiktok", title: "3 bruits de freins à ne jamais ignorer", handle: "@garagemtl", name: "Garage MTL", followers: 54_000, daysAgo: 14, views: 380_000, engagement: 0.077, durationSec: 35, format: "checklist", tags: ["brake", "diagnosis", "quebec"], language: "fr", region: "CA" },
];

/** Creators with known home regions; everyone else stays region-unknown (realistic). */
const CREATOR_REGIONS: Record<string, string> = {
  "@sixsidegarage": "CA",
  "@gtapartsrun": "CA",
  "@northwrench": "CA",
  "@drivewaydoctor": "CA",
  "@garagemtl": "CA",
  "@dylansdiag": "US",
  "@rustbeltrebuilds": "US",
  "@projectfarmish": "US",
  "@buildbaybros": "US",
};

function toEvidence(spec: FixtureSpec, now: Date): VideoEvidence {
  const publishedAt = new Date(now.getTime() - spec.daysAgo * 86_400_000).toISOString();
  const likes = Math.round(spec.views * spec.engagement * 0.82);
  const comments = Math.round(spec.views * spec.engagement * 0.07);
  const shares = Math.round(spec.views * spec.engagement * 0.11);
  const creator: Creator = {
    handle: spec.handle,
    displayName: spec.name,
    followerCount: spec.followers,
  };
  const slug = spec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const url =
    spec.platform === "youtube"
      ? `https://www.youtube.com/watch?v=fixture-${slug}`
      : `https://www.tiktok.com/${spec.handle}/video/fixture-${slug}`;
  return {
    platform: spec.platform,
    url,
    title: spec.title,
    creator,
    publishedAt,
    durationSec: spec.durationSec,
    format: spec.format,
    tags: spec.tags,
    metrics: {
      views: spec.views,
      likes,
      comments,
      shares,
      engagementRate: spec.engagement,
      overperformance: Math.round((spec.views / spec.followers) * 10) / 10,
    },
    provenance: "fixture",
    fetchedAt: now.toISOString(),
    language: spec.language ?? "en",
    region: spec.region ?? CREATOR_REGIONS[spec.handle],
  };
}

export function sphFixtureVideos(now: Date = new Date()): VideoEvidence[] {
  return specs.map((s) => toEvidence(s, now));
}
