/**
 * The OpportunityDossier: everything known about one Opportunity, assembled
 * once and fed to the detail page's section registry. Depends only on port
 * interfaces — no adapter imports.
 */
import type {
  BrandDNA,
  ClientProfile,
  Opportunity,
} from "../domain/types";
import type {
  BrandDNAPort,
  ClientPort,
  KnowledgeBaseDecision,
  KnowledgeBasePort,
  OpportunityRepository,
  PublishedContentPort,
} from "../ports";
import { explainBrandFit, type BrandFitExplanation } from "./scoring";
import { computeLearningAdjustments, type LearningAdjustment } from "./learning";
import {
  findRelatedPublished,
  findSimilarOpportunities,
  type RelatedPublished,
  type SimilarOpportunity,
} from "./similarity";

export interface OpportunityDossier {
  opportunity: Opportunity;
  client: ClientProfile;
  brandDna: BrandDNA;
  brandFit: BrandFitExplanation;
  /** Live learning adjustment given the client's current rejections. */
  adjustment?: LearningAdjustment;
  similar: SimilarOpportunity[];
  relatedPublished: RelatedPublished[];
  kbDecisions: KnowledgeBaseDecision[];
}

export interface DossierPorts {
  opportunities: OpportunityRepository;
  clients: ClientPort;
  brandDna: BrandDNAPort;
  knowledgeBase: KnowledgeBasePort;
  publishedContent: PublishedContentPort;
}

export async function assembleDossier(
  ports: DossierPorts,
  opportunityId: string,
): Promise<OpportunityDossier | null> {
  const opportunity = await ports.opportunities.get(opportunityId);
  if (!opportunity) return null;

  const [client, brandDna, siblings, kbAll, published] = await Promise.all([
    ports.clients.get(opportunity.clientId),
    ports.brandDna.get(opportunity.clientId),
    ports.opportunities.listByClient(opportunity.clientId),
    ports.knowledgeBase.listDecisions(opportunity.clientId),
    ports.publishedContent.listByClient(opportunity.clientId),
  ]);
  if (!client || !brandDna) return null;

  const rejected = siblings.filter((o) => o.state === "rejected");
  const adjustment = computeLearningAdjustments([opportunity], rejected).get(opportunity.id);

  return {
    opportunity,
    client,
    brandDna,
    brandFit: opportunity.video
      ? explainBrandFit(opportunity.video, brandDna, client)
      : { nicheMatches: [], productMatches: [], traitMatches: [], guardrailConflicts: [] },
    adjustment,
    similar: findSimilarOpportunities(opportunity, siblings),
    relatedPublished: opportunity.video
      ? findRelatedPublished(opportunity.video, published)
      : [],
    kbDecisions: kbAll.filter((d) => d.opportunityId === opportunity.id),
  };
}
