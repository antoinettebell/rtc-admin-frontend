// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { MenuCategory, User } from "@/interfaces/user-interface";

class CategoryApiService extends BaseAPI {
  list(search: string, page: number, limit = 10, extraParam = {}) {
    return this.getPaginated<MenuCategory>(
      `${APIEndpoint.CATEGORY}`,
      "categoryList",
      {
        params: {
          page,
          limit,
          ...(search.trim().length ? { search: search.trim() } : {}),
          ...extraParam,
        },
      },
    );
  }
}

export const categoryApiService = new CategoryApiService();
