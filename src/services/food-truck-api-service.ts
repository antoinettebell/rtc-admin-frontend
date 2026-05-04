// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { IResponse } from "@/interfaces/response-interface";
import { FoodTruck, FoodTruckLocation } from "@/interfaces/user-interface";

type FoodTruckLocationPayload = Omit<FoodTruckLocation, "_id"> & {
  _id?: string;
};

type FoodTruckUpdatePayload = Omit<Partial<FoodTruck>, "locations"> & {
  locations?: FoodTruckLocationPayload[];
} & Record<string, unknown>;

class FoodTruckApiService extends BaseAPI {
  update(id: string, data: FoodTruckUpdatePayload) {
    return this.put<IResponse<boolean>>(
      `${APIEndpoint.FOOD_TRUCK}/${id}`,
      data,
    );
  }

  updateExtra(id: string, featured: boolean) {
    return this.put<IResponse<boolean>>(
      `${APIEndpoint.FOOD_TRUCK}/${id}/update-extra`,
      {
        featured,
      },
    );
  }
}

export const foodTruckApiService = new FoodTruckApiService();
