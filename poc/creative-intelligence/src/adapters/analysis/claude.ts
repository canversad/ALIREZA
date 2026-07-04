/**
 * Claude-powered deep analysis engine (AnalysisEngine port).
 *
 * Active only when ANTHROPIC_API_KEY is configured (see container.ts) —
 * otherwise the fixture engine serves demo output and the app never
 * hard-fails. Uses structured outputs (output_config.format json_schema)
 * so the response always parses into OpportunityAnalysis.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisEngine, OpportunityAnalysis } from "@/core/ports";
import type { BrandDNA, ClientProfile, Opportunity } from "@/core/domain/types";

const MODEL = process.env.CI_ANALYSIS_MODEL ?? "claude-opus-4-8";

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    whyItWorked: {
      type: "string",
      description: "2-3 sentences: the psychological/format mechanics that made this video viral",
    },
    transferablePattern: {
      type: "string",
      description: "One sentence naming the reusable content pattern, phrased generically",
    },
    adaptationAngles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          angle: { type: "string", description: "Concrete video concept for this client" },
          brandTrait: { type: "string", description: "The Brand DNA trait this angle expresses" },
          effort: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["angle", "brandTrait", "effort"],
        additionalProperties: false,
      },
    },
    watchOuts: {
      type: "array",
      items: { type: "string" },
      description: "Brand-safety or production risks in adapting this, incl. guardrail conflicts",
    },
    verdict: { type: "string", enum: ["strong-adapt", "possible-adapt", "skip"] },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["whyItWorked", "transferablePattern", "adaptationAngles", "watchOuts", "verdict", "confidence"],
  additionalProperties: false,
} as const;

const SYSTEM = `You are a senior content strategist at a marketing agency analyzing a viral
social video as an adaptation candidate for a specific client. Be concrete and honest:
if the video's success doesn't transfer to this client, say so with verdict "skip".
Angles must be producible by a small local business. Never invent metrics.`;

export class ClaudeAnalysisEngine implements AnalysisEngine {
  readonly id = `claude:${MODEL}`;
  private client = new Anthropic();

  async analyze(input: {
    opportunity: Opportunity;
    brandDna: BrandDNA;
    client: ClientProfile;
  }): Promise<OpportunityAnalysis> {
    const { opportunity: o, brandDna, client } = input;
    const v = o.video;
    if (!v) throw new Error("Deep analysis requires video evidence");

    const prompt = [
      `## Viral video (evidence, provenance: ${v.provenance})`,
      `Title: ${v.title}`,
      `Platform: ${v.platform} · Format: ${v.format} · Duration: ${v.durationSec}s`,
      `Creator: ${v.creator.displayName} (${v.creator.followerCount} followers)`,
      `Published: ${v.publishedAt}`,
      `Metrics: ${v.metrics.views} views, ${v.metrics.likes} likes, ${v.metrics.comments} comments, ` +
        `${v.metrics.shares} shares, engagement rate ${(v.metrics.engagementRate * 100).toFixed(1)}%, ` +
        `${v.metrics.overperformance}x creator baseline`,
      `Tags: ${v.tags.join(", ")}`,
      ``,
      `## Client`,
      `${client.name} — ${client.industry}, ${client.location}`,
      `Niche keywords: ${client.nicheKeywords.join(", ")}`,
      ``,
      `## Brand DNA (read-only)`,
      `Traits: ${brandDna.traits.join(", ")}`,
      `Tone: ${brandDna.tone}`,
      `Audience: ${brandDna.audience}`,
      `Product lines: ${brandDna.productLines.join(", ")}`,
      `Guardrails (never associate with): ${brandDna.guardrails.join(", ")}`,
      ``,
      `Analyze why this video went viral and how ${client.name} could adapt the pattern.`,
    ].join("\n");

    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: SYSTEM,
        output_config: { format: { type: "json_schema", schema: ANALYSIS_SCHEMA } },
        messages: [{ role: "user", content: prompt }],
      });

      if (response.stop_reason === "refusal") {
        throw new Error("The analysis model declined this request (safety refusal).");
      }
      if (response.stop_reason === "max_tokens") {
        throw new Error("Analysis output was truncated — try again.");
      }
      const text = response.content.find(
        (b): b is Extract<typeof b, { type: "text" }> => b.type === "text",
      )?.text;
      if (!text) throw new Error("Analysis returned no content.");

      const parsed = JSON.parse(text) as Omit<OpportunityAnalysis, "generatedBy" | "generatedAt">;
      return {
        ...parsed,
        generatedBy: this.id,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      // Typed chain, most specific first — surfaced honestly to the UI.
      if (error instanceof Anthropic.AuthenticationError) {
        throw new Error("Anthropic API key is invalid — check ANTHROPIC_API_KEY.");
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new Error("Anthropic rate limit reached — try again in a moment.");
      }
      if (error instanceof Anthropic.APIConnectionError) {
        throw new Error("Could not reach the Anthropic API — check network access.");
      }
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Anthropic API error (${error.status}): ${error.message}`);
      }
      throw error;
    }
  }
}
