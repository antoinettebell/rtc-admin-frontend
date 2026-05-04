// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { Cuisine } from "@/interfaces/user-interface";

class CuisineApiService extends BaseAPI {
  list(search: string, page: number, limit = 10) {
    return this.getPaginated<Cuisine>(`${APIEndpoint.CUISINE}`, "cuisineList", {
      params: {
        page,
        limit,
        ...(search.trim().length ? { search: search.trim() } : {}),
      },
    });
  }
  add(name: string) {
    return this.post<boolean>(`${APIEndpoint.CUISINE}`, { name });
  }
  update(id: string, name: string) {
    return this.put<boolean>(`${APIEndpoint.CUISINE}/${id}`, { name });
  }

  destroy(id: string) {
    return this.delete<boolean>(`${APIEndpoint.CUISINE}/${id}`);
  }
}

export const cuisineApiService = new CuisineApiService();
