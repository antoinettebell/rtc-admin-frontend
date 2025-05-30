// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { MenuCategory, MenuItem, User } from "@/interfaces/user-interface";

class MenuApiService extends BaseAPI {
  list(search: string, page: number, limit = 10, extraParam = {}) {
    return this.getPaginated<MenuItem>(`${APIEndpoint.MENU}`, "menuList", {
      params: {
        page,
        limit,
        ...(search.trim().length ? { search: search.trim() } : {}),
        ...extraParam,
      },
    });
  }
}

export const menuApiService = new MenuApiService();
