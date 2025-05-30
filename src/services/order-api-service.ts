// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { OrderItem } from "@/interfaces/user-interface";
import { IResponse } from "@/interfaces/response-interface";

class OrderApiService extends BaseAPI {
  getById(id: string) {
    return this.get<IResponse<{ order: OrderItem }>>(
      `${APIEndpoint.ORDER}/${id}`,
    );
  }

  list(search: string, page: number, limit = 10, extraParam = {}) {
    return this.getPaginated<OrderItem>(`${APIEndpoint.ORDER}`, "orderList", {
      params: {
        page,
        limit,
        ...(search.trim().length ? { search: search.trim() } : {}),
        ...extraParam,
      },
    });
  }
}

export const orderApiService = new OrderApiService();
