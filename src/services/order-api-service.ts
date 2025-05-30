// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import {
  MenuCategory,
  MenuItem,
  OrderItem,
  User,
} from "@/interfaces/user-interface";

class OrderApiService extends BaseAPI {
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
