// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { IResponse } from "@/interfaces/response-interface";
import {
  FoodTruck,
  FoodTruckLocation,
} from "@/interfaces/user-interface";

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

  toggleLocationOrdering(
    id: string,
    locationId: string,
    isOrderingOpen: boolean,
    truckUnitId?: string,
  ) {
    return this.patch<IResponse<{ foodtruck: FoodTruck }>>(
      `${APIEndpoint.FOOD_TRUCK}/${id}/location/${locationId}/ordering-open`,
      {
        isOrderingOpen,
        truck_unit_id: truckUnitId || null,
      },
    );
  }

  deleteLocation(id: string, locationId: string) {
    return this.delete<IResponse<{ foodtruck: FoodTruck }>>(
      `${APIEndpoint.FOOD_TRUCK}/${id}/location/${locationId}`,
    );
  }

  uploadDocument(
    id: string,
    file: File,
    data: { title?: string; document_type?: string; replace_existing?: boolean },
  ) {
    const fd = new FormData();
    fd.append("file", file);
    if (data.title) fd.append("title", data.title);
    if (data.document_type) fd.append("document_type", data.document_type);
    if (data.replace_existing) fd.append("replace_existing", "true");

    return this.post<IResponse<{ foodtruck: FoodTruck }>>(
      `${APIEndpoint.FOOD_TRUCK}/${id}/documents`,
      fd,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  }

  deleteDocument(id: string, documentId: string) {
    return this.delete<IResponse<{ foodtruck: FoodTruck }>>(
      `${APIEndpoint.FOOD_TRUCK}/${id}/documents/${documentId}`,
    );
  }
}

export const foodTruckApiService = new FoodTruckApiService();
