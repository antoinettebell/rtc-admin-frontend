import { IResponse } from "@/interfaces/response-interface";
import { BaseAPI } from "./base-api";

export type SocialContentLifecycleStatus =
  | "DRAFT"
  | "CREATIVE_PRODUCTION"
  | "VERIFICATION_REQUIRED"
  | "READY_FOR_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "FAILED";

export interface SocialContentRecord {
  contentId: string;
  brandCode: "RTC" | "SBE";
  lifecycleStatus: SocialContentLifecycleStatus;
  verificationComplete: boolean;
  createdAt: string;
  updatedAt: string;
  approvedBy: string | null;
  rejectedBy: string | null;
  creativeProduction?: { status?: string; failure?: { code?: string }; finalAssetKey?: string | null };
  contentPackage: {
    decision?: Record<string, unknown>;
    content?: Record<string, unknown>;
    platforms?: Array<Record<string, unknown>>;
    creative?: Record<string, unknown>;
    verification?: Record<string, unknown>;
    publishing?: Record<string, unknown>;
    tracking?: Record<string, unknown>;
  };
}

class SocialMediaContentApiService extends BaseAPI {
  list() {
    return this.get<IResponse<{ content: SocialContentRecord[] }>>("/api/v1/marketing/social-content");
  }

  requestDecision(brandCode: "RTC") {
    return this.post<IResponse<{ content: SocialContentRecord }>>(
      "/api/v1/marketing/social-content/request-decision",
      { brandCode },
    );
  }

  completeVerification(contentId: string) {
    return this.post<IResponse<{ content: SocialContentRecord }>>(
      `/api/v1/marketing/social-content/${encodeURIComponent(contentId)}/verification-complete`,
    );
  }

  approve(contentId: string) {
    return this.post<IResponse<{ content: SocialContentRecord }>>(
      `/api/v1/marketing/social-content/${encodeURIComponent(contentId)}/approve`,
    );
  }

  reject(contentId: string) {
    return this.post<IResponse<{ content: SocialContentRecord }>>(
      `/api/v1/marketing/social-content/${encodeURIComponent(contentId)}/reject`,
    );
  }

  regenerateCreative(contentId: string) {
    return this.post<IResponse<{ content: SocialContentRecord }>>(
      `/api/v1/marketing/social-content/${encodeURIComponent(contentId)}/creative/regenerate`,
    );
  }

  creativePreview(contentId: string) {
    return this.get<IResponse<{ previewUrl: string | null; previewUrls: string[] }>>(
      `/api/v1/marketing/social-content/${encodeURIComponent(contentId)}/creative/preview`,
    );
  }
}

export const socialMediaContentApiService = new SocialMediaContentApiService();
