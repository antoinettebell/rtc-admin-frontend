import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { IResponse } from "@/interfaces/response-interface";

class PublicApiService extends BaseAPI {
  getPrivacyPolicy() {
    return this.get<IResponse<{ privacyPolicy: string }>>(
      `${APIEndpoint.PUBLIC_PRIVACY_POLICY}`,
    );
  }
}

export const publicApiService = new PublicApiService();
