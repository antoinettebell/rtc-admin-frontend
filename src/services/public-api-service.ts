import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { IResponse } from "@/interfaces/response-interface";

class PublicApiService extends BaseAPI {
  getPrivacyPolicy() {
    return this.get<IResponse<{ privacyPolicy: string }>>(
      `${APIEndpoint.PUBLIC_PRIVACY_POLICY}`,
    );
  }
  getPlanList(search: string, page: number, limit = 10) {
    return this.get<IResponse<{ records: any[]; planList?: any[] }>>(
      `${APIEndpoint.PUBLIC}/plan?search=${search}&page=${page}&limit=${limit}`,
    );
  }

  getAddOnsList(search: string, page: number, limit = 10) {
    return this.get<IResponse<{ records: any[]; addonsList?: any[] }>>(
      `${APIEndpoint.PUBLIC}/add-ons?search=${search}&page=${page}&limit=${limit}`,
    );
  }
}

export const publicApiService = new PublicApiService();
