// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { User } from "@/interfaces/user-interface";

class DietApiService extends BaseAPI {
  list(search: string, page: number, limit = 10) {
    return this.getPaginated<User>(`${APIEndpoint.DIET}`, "dietList", {
      params: {
        page,
        limit,
        ...(search.trim().length ? { search: search.trim() } : {}),
      },
    });
  }
  add(name: string) {
    return this.post<boolean>(`${APIEndpoint.DIET}`, { name });
  }
  update(id: string, name: string) {
    return this.put<boolean>(`${APIEndpoint.DIET}/${id}`, { name });
  }

  destroy(id: string) {
    return this.delete<boolean>(`${APIEndpoint.DIET}/${id}`);
  }
}

export const dietApiService = new DietApiService();
