// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { Banner, OrderItem } from "@/interfaces/user-interface";
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
}

export const bannerApiService = new BannerApiService();
