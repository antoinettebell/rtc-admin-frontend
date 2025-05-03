// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { IPaginateResponse, IResponse } from "@/interfaces/response-interface";
import { User } from "@/interfaces/user-interface";

class UserApiService extends BaseAPI {
  listVendors(page: number, status: string | null, search: string, limit = 10) {
    return this.getPaginated<User>(`${APIEndpoint.USER}`, "userList", {
      params: {
        userType: "VENDOR",
        page,
        limit,
        ...(status ? { status } : {}),
        ...(search.trim().length ? { search: search.trim() } : {}),
      },
    });
  }

  listCustomer(page: number, inactive: string, search: string, limit = 20) {
    return this.getPaginated<User>(`${APIEndpoint.USER}`, "userList", {
      params: {
        userType: "CUSTOMER",
        page,
        limit,
        ...(inactive ? { inactive } : {}),
        ...(search.trim().length ? { search: search.trim() } : {}),
      },
    });
  }

  getOverview() {
    return this.get<
      IResponse<{
        totalVendor: number;
        pendingVendor: number;
        rejectedVendor: number;
        totalUser: number;
        inactiveUser: number;
      }>
    >(`${APIEndpoint.USER}/overview/counter`);
  }

  getById(id: string) {
    return this.get<IResponse<{ user: User }>>(`${APIEndpoint.USER}/${id}`);
  }

  changeStatus(id: string, inactive) {
    return this.put<IResponse<boolean>>(
      `${APIEndpoint.USER}/${id}/change-status`,
      {
        inactive,
      },
    );
  }

  changeRequest(id: string, requestStatus: "APPROVED" | "REJECTED") {
    return this.put<IResponse<boolean>>(
      `${APIEndpoint.USER}/${id}/change-request`,
      {
        requestStatus,
      },
    );
  }
}

export const userApiService = new UserApiService();
