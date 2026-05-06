import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { Coupon } from "@/interfaces/user-interface";
import { IResponse } from "@/interfaces/response-interface";

export type CouponPayload = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxDiscount?: number | null;
  usageLimit: "NOLIMIT";
  fundedBy: "APP";
  validFrom?: string | null;
  validTill?: string | null;
};

class CouponApiService extends BaseAPI {
  list(search: string, page: number, limit = 10) {
    return this.getPaginated<Coupon>(`${APIEndpoint.COUPON}`, "couponList", {
      params: {
        page,
        limit,
        fundedBy: "APP",
        ...(search.trim().length ? { search: search.trim() } : {}),
      },
    });
  }

  create(data: CouponPayload) {
    return this.post<IResponse<{ coupon: Coupon }>>(`${APIEndpoint.COUPON}`, data);
  }

  update(id: string, data: Partial<CouponPayload> & { status?: "ACTIVE" | "ARCHIVED"; isActive?: boolean }) {
    return this.put<IResponse<{ coupon: Coupon }>>(
      `${APIEndpoint.COUPON}/${id}`,
      data,
    );
  }

  archiveActive() {
    return this.post<IResponse<{ archivedCount: number }>>(
      `${APIEndpoint.COUPON}/archive-active`,
    );
  }
}

export const couponApiService = new CouponApiService();
