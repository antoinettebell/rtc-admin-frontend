// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { Review, ReviewStats } from "@/interfaces/user-interface";

class ReviewApiService extends BaseAPI {
  list(foodTruckId: string, search: string, page: number, limit = 10) {
    return this.getPaginated<Review>(`${APIEndpoint.REVIEW}`, "reviewList", {
      params: {
        foodTruckId,
        page,
        limit,
        ...(search.trim().length ? { search: search.trim() } : {}),
      },
    });
  }
  stats(foodTruckId: string) {
    return this.get<ReviewStats>(`${APIEndpoint.REVIEW}/stats`, {
      params: {
        foodTruckId,
      },
    });
  }
}

export const reviewApiService = new ReviewApiService();
