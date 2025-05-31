// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { Banner } from "@/interfaces/user-interface";
import { IResponse } from "@/interfaces/response-interface";

class BannerApiService extends BaseAPI {
  getById(id: string) {
    return this.get<IResponse<{ banner: Banner }>>(
      `${APIEndpoint.BANNER}/${id}`,
    );
  }

  list(search: string, page: number, limit = 10, extraParam = {}) {
    return this.getPaginated<Banner>(`${APIEndpoint.BANNER}`, "bannerList", {
      params: {
        page,
        limit,
        ...(search.trim().length ? { search: search.trim() } : {}),
        ...extraParam,
      },
    });
  }

  add(data: Banner) {
    return this.post<boolean>(`${APIEndpoint.BANNER}`, data);
  }

  update(id: string, data: Banner) {
    return this.put<boolean>(`${APIEndpoint.BANNER}/${id}`, data);
  }

  destroy(id: string) {
    return this.delete<boolean>(`${APIEndpoint.BANNER}/${id}`);
  }
}

export const bannerApiService = new BannerApiService();
