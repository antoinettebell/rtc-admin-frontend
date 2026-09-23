import { BaseAPI } from "./base-api";
import { IResponse } from "@/interfaces/response-interface";
import { campaignApprovalEndpoints } from "@/helpers/marketing-campaign-approval";

export type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED";
export type GenerationStatus = "PROCESSING" | "COMPLETED" | "FAILED";

export interface MarketingCampaign {
  campaignId: string;
  vendorId: string | null;
  businessName: string;
  campaignType: string;
  reason: string;
  createdAt: string;
  generatedAt: string;
  updatedAt: string;
  approvedAt: string | null;
  videoUrl: string | null;
  approvalStatus: ApprovalStatus;
  generationStatus: GenerationStatus;
  regenerationCount: number;
}

export interface MarketingCampaignDetail extends MarketingCampaign {
  archivedAt: string | null;
  campaignMonth: string | null;
  campaignVersion: number;
  selectedFoodImages: Array<{ name: string | null; category: string | null; url: string }>;
  scheduleText: string | null;
  supportedServices: string[];
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

  generate(requestId: string) {
    return this.post<IResponse<{ results: Array<{ action: string; campaign: MarketingCampaign | null }> }>>(
      campaignApprovalEndpoints.generate,
      { requestId },
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

  regenerate(campaignId: string, reason: string) {
    return this.post<IResponse<{ result: { action: string; campaign: MarketingCampaign } }>>(
      campaignApprovalEndpoints.regenerate(campaignId),
      { reason },
    );
  }
}

export const marketingCampaignApiService = new MarketingCampaignApiService();
