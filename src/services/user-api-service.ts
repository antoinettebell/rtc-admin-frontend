// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/modals/api-endpoint";
import { IPaginateResponse, IResponse } from "@/interfaces/response-interface";
import { User } from "@/interfaces/user-interface";

class UserApiService extends BaseAPI {
  list() {
    return this.get<IPaginateResponse<User>>(`${APIEndpoint.USER}`);
  }

  getById(id: number) {
    return this.get<IResponse<{ user: User }>>(`${APIEndpoint.USER}/${id}`);
  }
}

export const userApiService = new UserApiService();
