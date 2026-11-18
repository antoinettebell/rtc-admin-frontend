import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { IResponse } from "@/interfaces/response-interface";

export type AmbassadorCode = {
  _id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt?: string;
};

export type AmbassadorCodePayload = Omit<AmbassadorCode, "_id" | "createdAt" | "isActive"> & {
  isActive?: boolean;
};

class AmbassadorCodeApiService extends BaseAPI {
  list(search: string, page: number, limit = 10) {
    return this.getPaginated<AmbassadorCode>(APIEndpoint.AMBASSADOR_CODE, "ambassadorCodeList", {
      params: { page, limit, ...(search.trim() ? { search: search.trim() } : {}) },
    });
  }

  create(data: AmbassadorCodePayload) {
    return this.post<IResponse<{ ambassadorCode: AmbassadorCode }>>(APIEndpoint.AMBASSADOR_CODE, data);
  }

  update(id: string, data: Partial<AmbassadorCodePayload>) {
    return this.put<IResponse<{ ambassadorCode: AmbassadorCode }>>(`${APIEndpoint.AMBASSADOR_CODE}/${id}`, data);
  }

  archive(id: string) {
    return this.delete<IResponse<{ ambassadorCode: AmbassadorCode }>>(`${APIEndpoint.AMBASSADOR_CODE}/${id}`);
  }
}

export const ambassadorCodeApiService = new AmbassadorCodeApiService();
