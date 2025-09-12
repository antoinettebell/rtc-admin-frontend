// services/user-service.ts
import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { IResponse } from "@/interfaces/response-interface";
import { User } from "@/interfaces/user-interface";

class UserApiService extends BaseAPI {
  listVendors(
    page: number,
    status: string | null,
    search: string,
    limit = 10,
    profileComplete = "",
  ) {
    return this.getPaginated<User>(`${APIEndpoint.USER}`, "userList", {
      params: {
        userType: "VENDOR",
        page,
        limit,
        ...(status ? { status } : {}),
        ...(search.trim().length ? { search: search.trim() } : {}),
        ...(profileComplete ? { profileComplete } : {}),
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

  update(id: string, data: Partial<User>) {
    return this.put<IResponse<boolean>>(`${APIEndpoint.USER}/${id}`, data);
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

  changeRequest(
    id: string,
    requestStatus: "APPROVED" | "REJECTED",
    reasonForRejection = "",
  ) {
    return this.put<IResponse<boolean>>(
      `${APIEndpoint.USER}/${id}/change-request`,
      {
        requestStatus,
        reasonForRejection,
      },
    );
  }

  

  forgotPassword(data: { email: string; userType: string; forFe?: boolean }) {
    return this.post<IResponse<boolean>>(`${APIEndpoint.AUTH}/forgot-password`, data);
  }

  changePassword(data: { password: string; token: string }) {
    return this.post<IResponse<boolean>>(`${APIEndpoint.AUTH}/change-password`, data);
  }

  checkToken(data: { token: string }) {
    return this.get<IResponse<boolean>>(`${APIEndpoint.AUTH}/validate-change-password-token`, {
      params: data, // <--- send as query
    });
  }
}

export const userApiService = new UserApiService();
