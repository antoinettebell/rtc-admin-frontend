import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { SiteSetting } from "@/interfaces/user-interface";
import { IResponse } from "@/interfaces/response-interface";

class SettingApiService extends BaseAPI {
  getFull() {
    return this.get<IResponse<{ setting: SiteSetting | null }>>(
      `${APIEndpoint.SETTING}`,
    );
  }

  updateTerms(termsConditions: string) {
    return this.post<IResponse<{ setting: SiteSetting | null }>>(
      `${APIEndpoint.SETTING}/terms-conditions`,
      { termsConditions },
    );
  }

  updatePolicy(privacyPolicy: string) {
    return this.post<IResponse<{ setting: SiteSetting | null }>>(
      `${APIEndpoint.SETTING}/privacy-policy`,
      { privacyPolicy },
    );
  }

  updateAgreement(agreement: string) {
    return this.post<IResponse<{ setting: SiteSetting | null }>>(
      `${APIEndpoint.SETTING}/agreement`,
      { agreement },
    );
  }

  // Free Loyalty Bucks settings
  updateFreeDessert(payload: {
    freeDessertAmount: number;
    freeDessertOrderCount: number;
    isFreeDessertEnabled: boolean;
  }) {
    return this.post<IResponse<{ setting: SiteSetting | null }>>(
      `${APIEndpoint.SETTING}/free-dessert`,
      payload,
    );
  }
}

export const settingApiService = new SettingApiService();
