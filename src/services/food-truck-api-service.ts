// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { IResponse } from "@/interfaces/response-interface";
import { FoodTruck } from "@/interfaces/user-interface";

class FoodTruckApiService extends BaseAPI {
  update(id: string, data: Partial<FoodTruck>) {
    return this.put<IResponse<boolean>>(
      `${APIEndpoint.FOOD_TRUCK}/${id}`,
      data,
    );
  }

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
