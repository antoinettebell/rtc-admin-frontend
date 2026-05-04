// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { Categoriess } from "@/interfaces/user-interface";

class CategoriesApiService extends BaseAPI {
  list(search: string, page: number, limit = 10) {
    return this.getPaginated<Categoriess>(
      `${APIEndpoint.CATEGORIES}`,
      "categoriesList",
      {
        params: {
          page,
          limit,
          ...(search.trim().length ? { search: search.trim() } : {}),
        },
      },
    );
  }
  add(name: string) {
    return this.post<boolean>(`${APIEndpoint.CATEGORIES}`, { name });
  }
  update(id: string, name: string) {
    return this.put<boolean>(`${APIEndpoint.CATEGORIES}/${id}`, { name });
  }

  destroy(id: string) {
    return this.delete<boolean>(`${APIEndpoint.CATEGORIES}/${id}`);
  }
}

export const categoriesApiService = new CategoriesApiService();
