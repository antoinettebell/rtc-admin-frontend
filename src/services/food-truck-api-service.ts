// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { IResponse } from "@/interfaces/response-interface";

class FoodTruckApiService extends BaseAPI {
  updateExtra(id: string, featured) {
    return this.put<IResponse<boolean>>(
      `${APIEndpoint.FOOD_TRUCK}/${id}/update-extra`,
      {
        featured,
      },
    );
  }
}

export const foodTruckApiService = new FoodTruckApiService();
