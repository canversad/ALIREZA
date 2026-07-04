/**
 * Fixture analysis engine — deterministic heuristic output so the workflow is
 * fully testable without an API key. Clearly labeled in the UI as demo output;
 * the container swaps in ClaudeAnalysisEngine when ANTHROPIC_API_KEY is set.
 */
import type { AnalysisEngine, OpportunityAnalysis } from "@/core/ports";
import type { BrandDNA, ClientProfile, Opportunity, VideoFormat } from "@/core/domain/types";
import { explainBrandFit } from "@/core/services/scoring";

const FORMAT_MECHANIC: Record<VideoFormat, string> = {
  "counter-demo": "hands-on proof from behind the counter reads as insider access",
  "talking-head": "direct-to-camera expertise builds trust fast",
  "pov-skit": "relatable role-play makes the viewer the protagonist",
  checklist: "a finite, numbered promise keeps viewers to the end",
  "before-after": "a visible transformation is self-evident proof",
  "myth-bust": "contradicting common belief triggers comment debates",
  "cinematic-build": "craft spectacle earns watch time and shares",
  "vlog-tour": "behind-the-scenes access humanizes the business",
  reaction: "borrowed context plus authentic expertise is cheap to produce",
};

export class FixtureAnalysisEngine implements AnalysisEngine {
  readonly id = "fixture-engine (heuristic demo)";

  async analyze(input: {
    opportunity: Opportunity;
    brandDna: BrandDNA;
    client: ClientProfile;
  }): Promise<OpportunityAnalysis> {
    const { opportunity: o, brandDna, client } = input;
    const v = o.video;
    if (!v) throw new Error("Deep analysis requires video evidence");

    const fit = explainBrandFit(v, brandDna, client);
    const guardrailHit = fit.guardrailConflicts.length > 0;
    const matched = [...new Set([...fit.nicheMatches, ...fit.productMatches])];
    const m = v.metrics;
    const engagementStrong = m.engagementRate >= 0.07;
    const overperforming = m.overperformance >= 10;

    const traits = brandDna.traits;
    const angles = guardrailHit
      ? []
      : [
          {
            angle: `${client.name} version: "${v.title.length > 60 ? v.title.slice(0, 57) + "…" : v.title}" reframed around ${matched[0] ?? client.nicheKeywords[0]} at the counter`,
            brandTrait: traits[0],
            effort: "low" as const,
          },
          {
            angle: `Series pilot: apply the ${v.format} format to the top 3 customer questions about ${matched[1] ?? client.nicheKeywords[1]}`,
            brandTrait: traits[1] ?? traits[0],
            effort: "medium" as const,
          },
        ];

    return {
      whyItWorked: [
        `${FORMAT_MECHANIC[v.format].charAt(0).toUpperCase() + FORMAT_MECHANIC[v.format].slice(1)}.`,
        overperforming
          ? `At ${Math.round(m.overperformance)}× the creator's baseline, the topic (${v.tags.slice(0, 3).join(", ")}) clearly broke beyond their existing audience.`
          : `Reach stayed near the creator's baseline — the audience, not the topic, drove the numbers.`,
        engagementStrong
          ? `A ${(m.engagementRate * 100).toFixed(1)}% engagement rate signals genuine resonance, not passive scrolling.`
          : `Engagement of ${(m.engagementRate * 100).toFixed(1)}% is moderate — views outpaced reactions.`,
      ].join(" "),
      transferablePattern: `A ${v.format} that turns "${v.tags[0] ?? "the niche"}" knowledge into a trust moment any parts counter can recreate.`,
      adaptationAngles: angles,
      watchOuts: guardrailHit
        ? [
            `Brand DNA guardrail conflict: this video touches "${fit.guardrailConflicts.join('", "')}" — do not adapt directly.`,
          ]
        : [
            `Stay "${brandDna.tone.split("—")[0].trim()}" — don't mock the customer in the retelling.`,
            `Check music licensing before reusing the original's audio.`,
          ],
      verdict: guardrailHit
        ? "skip"
        : overperforming && matched.length > 0
          ? "strong-adapt"
          : "possible-adapt",
      confidence: guardrailHit ? "high" : matched.length > 0 ? "medium" : "low",
      generatedBy: this.id,
      generatedAt: new Date().toISOString(),
    };
  }
}
