// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/modals/api-endpoint";
import { IPaginateResponse, IResponse } from "@/interfaces/response-interface";
import { User } from "@/interfaces/user-interface";

class AuthApiService extends BaseAPI {
  login(email: string, password: string) {
    return this.post<IResponse<{ user: User; authToken: string }>>(
      `${APIEndpoint.LOGIN}`,
      { email, password },
    );
  }
}

export const authApiService = new AuthApiService();
