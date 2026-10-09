import { BaseAPI } from "./base-api";
import { IResponse } from "@/interfaces/response-interface";
import { campaignApprovalEndpoints } from "@/helpers/marketing-campaign-approval";

export type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED";
export type GenerationStatus = "PROCESSING" | "COMPLETED" | "FAILED";
export type RegenerationStatus =
  | "QUEUED"
  | "PROCESSING"
  | "RETRY_SCHEDULED"
  | "WAITING_FOR_RENDER"
  | "READY_FOR_APPROVAL"
  | "FAILED"
  | "TIMED_OUT"
  | "DEAD_LETTERED";

export interface MarketingCampaign {
  campaignId: string;
  vendorId: string | null;
  businessName: string;
  campaignType: string;
  creativeMode: "STANDARD_FEATURE" | "SCENARIO_TALKING" | null;
  reason: string;
  createdAt: string;
  generatedAt: string;
  updatedAt: string;
  approvedAt: string | null;
  videoUrl: string | null;
  approvalStatus: ApprovalStatus;
  generationStatus: GenerationStatus;
  regenerationStatus: RegenerationStatus | null;
  regenerationFailure: { code: string; stage: string | null } | null;
  nextRetryAt: string | null;
  regenerationCount: number;
}

export interface MarketingCampaignDetail extends MarketingCampaign {
  archivedAt: string | null;
  campaignMonth: string | null;
  campaignVersion: number;
  selectedFoodImages: Array<{ name: string | null; category: string | null; url: string }>;
  scheduleText: string | null;
  supportedServices: string[];
  visualVariation: {
    sequence: number;
    mode: string;
    animationVariantId: string;
    imageRotation: number;
  } | null;
  scenarioTalking: {
    dialogue: { operator: string; guide: string; proofNarration?: string; ctaNarration?: string } | null;
    templateId: string | null;
    screenshotKey: string | null;
    media: unknown | null;
  } | null;
}

export interface EligibleMarketingVendor {
  vendorId: string;
  businessName: string;
  truckUnits: Array<{
    truckUnitId: string;
    name: string;
    isPrimary: boolean;
  }>;
  generationBlocked: boolean;
}

export interface VendorSpotlightSelection {
  vendorId: string;
  truckUnitIds: string[];
}

export interface EligibleAppFeature {
  featureKey: string;
  featureName: string;
  audience: string;
  creativeModes: Array<"STANDARD_FEATURE" | "SCENARIO_TALKING">;
  generationBlocked: boolean;
}

export interface AppFeatureSelection {
  featureKey: string;
  creativeMode: "STANDARD_FEATURE" | "SCENARIO_TALKING";
}

export type ScenarioTalkingJobStatus = "QUEUED" | "PROCESSING" | "WAITING_FOR_RENDER" | "FAILED";
export type ScenarioTalkingJobStage =
  | "QUEUED" | "PREPARING_CONTENT" | "OPERATOR_VOICE" | "OPERATOR_ANIMATION"
  | "GUIDE_VOICE" | "GUIDE_ANIMATION" | "PROOF_NARRATION" | "CTA_NARRATION"
  | "RENDERING" | "FAILED";

export interface ScenarioTalkingGenerationJob {
  jobId: string;
  campaignId: string;
  featureKey: string;
  creativeMode: "SCENARIO_TALKING";
  status: ScenarioTalkingJobStatus;
  stage: ScenarioTalkingJobStage;
  failureCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EligibleMarketingEvent {
  eventId: string;
  eventName: string;
  eventDate: string | null;
  city: string | null;
  state: string | null;
  ticketMode: string;
  imageMode: string;
  generationBlocked: boolean;
}

class MarketingCampaignApiService extends BaseAPI {
  listPending() {
    return this.get<IResponse<{ campaigns: MarketingCampaign[] }>>(
      campaignApprovalEndpoints.pending,
    );
  }

  listApproved() {
    return this.get<IResponse<{ campaigns: MarketingCampaign[] }>>(
      campaignApprovalEndpoints.approved,
    );
  }

  listGenerationJobs() {
    return this.get<IResponse<{ jobs: ScenarioTalkingGenerationJob[] }>>(
      campaignApprovalEndpoints.generationJobs,
    );
  }

  listEligibleVendors() {
    return this.get<IResponse<{ vendors: EligibleMarketingVendor[] }>>(
      campaignApprovalEndpoints.eligibleVendors,
    );
  }

  listEligibleAppFeatures() {
    return this.get<IResponse<{ features: EligibleAppFeature[] }>>(
      campaignApprovalEndpoints.eligibleAppFeatures,
    );
  }

  listEligibleEvents() {
    return this.get<IResponse<{ events: EligibleMarketingEvent[] }>>(
      campaignApprovalEndpoints.eligibleEvents,
    );
  }

  generate(requestId: string, vendorSelections: VendorSpotlightSelection[]) {
    return this.post<IResponse<{ results: Array<{ action: string; campaign: MarketingCampaign | null }> }>>(
      campaignApprovalEndpoints.generate,
      { requestId, vendorSelections },
    );
  }

  generateAppFeatures(requestId: string, featureSelections: AppFeatureSelection[]) {
    return this.post<IResponse<{ results: Array<{ action: string; campaign: MarketingCampaign | null; jobId?: string; creativeMode?: string }> }>>(
      campaignApprovalEndpoints.generateAppFeatures,
      { requestId, featureSelections },
    );
  }

  generateEvents(requestId: string, eventIds: string[]) {
    return this.post<IResponse<{ results: Array<{ action: string; campaign: MarketingCampaign | null }> }>>(
      campaignApprovalEndpoints.generateEvents,
      { requestId, eventIds },
    );
  }

  getDetails(campaignId: string) {
    return this.get<IResponse<{ campaign: MarketingCampaignDetail }>>(
      campaignApprovalEndpoints.details(campaignId),
    );
  }

  approve(campaignId: string) {
    return this.post<IResponse<{ campaign: MarketingCampaign }>>(
      campaignApprovalEndpoints.approve(campaignId),
    );
  }

  discard(campaignId: string) {
    return this.post<IResponse<{ campaign: MarketingCampaign }>>(
      campaignApprovalEndpoints.discard(campaignId),
      undefined,
      { timeout: 20_000 },
    );
  }

  regenerate(campaignId: string, reason: string) {
    return this.post<IResponse<{ result: {
      action: string;
      campaignId: string;
      jobId: string;
      status: RegenerationStatus;
    } }>>(
      campaignApprovalEndpoints.regenerate(campaignId),
      { reason },
    );
  }
}

export const marketingCampaignApiService = new MarketingCampaignApiService();
