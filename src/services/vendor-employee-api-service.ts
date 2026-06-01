import { IResponse } from "@/interfaces/response-interface";
import { VendorEmployee } from "@/interfaces/user-interface";
import { APIEndpoint } from "@/models/api-endpoint";
import { BaseAPI } from "./base-api";

export type VendorEmployeePayload = {
  vendor_user_id: string;
  food_truck_id: string;
  assigned_location_id: string;
  first_name: string;
  last_name: string;
  zip_code: string;
  pin: string;
  is_active?: boolean;
  is_working?: boolean;
};

class VendorEmployeeApiService extends BaseAPI {
  list(params: {
    vendorUserId: string;
    foodTruckId?: string;
    archivedOnly?: boolean;
  }) {
    return this.get<
      IResponse<{ vendoremployeeList: VendorEmployee[] }>
    >(`${APIEndpoint.VENDOR_EMPLOYEE}/admin`, {
      params,
    });
  }

  create(data: VendorEmployeePayload) {
    return this.post<IResponse<{ vendoremployee: VendorEmployee }>>(
      `${APIEndpoint.VENDOR_EMPLOYEE}/admin`,
      data,
    );
  }

  update(id: string, data: Partial<VendorEmployee>) {
    return this.put<IResponse<{ vendoremployee: VendorEmployee }>>(
      `${APIEndpoint.VENDOR_EMPLOYEE}/admin/${id}`,
      data,
    );
  }

  archive(id: string) {
    return this.patch<IResponse<{ vendoremployee: VendorEmployee }>>(
      `${APIEndpoint.VENDOR_EMPLOYEE}/admin/${id}/archive`,
      {},
    );
  }

  remove(id: string) {
    return this.delete<IResponse<{ vendoremployee: VendorEmployee }>>(
      `${APIEndpoint.VENDOR_EMPLOYEE}/admin/${id}`,
    );
  }

  resetPin(id: string, resetUrl?: string) {
    return this.put<IResponse<{ vendoremployee: VendorEmployee }>>(
      `${APIEndpoint.VENDOR_EMPLOYEE}/admin/${id}/reset-pin`,
      { resetUrl },
    );
  }
}

export const vendorEmployeeApiService = new VendorEmployeeApiService();
