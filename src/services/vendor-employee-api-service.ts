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

export type VendorEmployeeUpdatePayload = Partial<
  Pick<
    VendorEmployee,
    | "assigned_location_id"
    | "assigned_truck_unit_id"
    | "first_name"
    | "last_name"
    | "zip_code"
    | "phone_number"
    | "address_line1"
    | "address_city"
    | "address_state"
    | "address_zip"
    | "employee_id_photo_url"
    | "employee_tax_identifier_type"
    | "employee_rate"
    | "tap_to_pay_serial_number"
    | "is_active"
    | "is_working"
    | "weekly_schedule"
    | "schedule_assignments"
  >
> & {
  employee_tax_identifier?: string;
  archive_schedule?: boolean;
};

export type VendorEmployeeTimecard = {
  employee_session_id: string;
  started_at: string;
  ended_at: string | null;
  total_break_minutes: number;
  gross_hours_worked?: number | null;
  net_hours_worked?: number | null;
  is_active: boolean;
  is_archived?: boolean;
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

  update(id: string, data: VendorEmployeeUpdatePayload) {
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

  shiftHistory(id: string, range: "day" | "week" = "week") {
    return this.get<IResponse<{ sessions: VendorEmployeeTimecard[] }>>(
      `${APIEndpoint.VENDOR_EMPLOYEE}/admin/${id}/shift-history`,
      { params: { range } },
    );
  }

  updateShiftHistory(
    id: string,
    sessionId: string,
    data: {
      started_at: string;
      ended_at: string;
      total_break_minutes: number;
      reason: string;
    },
  ) {
    return this.put<IResponse<{ session: VendorEmployeeTimecard }>>(
      `${APIEndpoint.VENDOR_EMPLOYEE}/admin/${id}/shift-history/${sessionId}`,
      data,
    );
  }
}

export const vendorEmployeeApiService = new VendorEmployeeApiService();
