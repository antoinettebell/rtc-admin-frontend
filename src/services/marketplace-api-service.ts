import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { IResponse } from "@/interfaces/response-interface";

export type MarketplaceFileStatus = "ACTIVE" | "ARCHIVED" | "DELETED" | "FLAGGED";
export type MarketplacePaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface MarketplaceRepositoryFile {
  attachment_id: string;
  event_id: string;
  bid_id?: string | null;
  attachment_type: string;
  file_url: string;
  file_key?: string | null;
  original_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  uploaded_by_user_id: string;
  status: MarketplaceFileStatus;
  status_reason?: string | null;
  created_at?: string;
  marketplaceEvent?: {
    event_id: string;
    event_name: string;
    customer_user_id: string;
  } | null;
  marketplaceBid?: {
    bid_id: string;
    vendor_user_id: string;
    food_truck_id: string;
    bid_status: string;
  } | null;
  vendor_user_id?: string | null;
  food_truck_id?: string | null;
}

export interface MarketplacePayment {
  payment_id: string;
  event_id: string;
  bid_id?: string | null;
  payer_user_id: string;
  payer_type: "CUSTOMER" | "VENDOR";
  food_truck_id?: string | null;
  payment_type:
    | "COORDINATOR_AWARD_FEE"
    | "VENDOR_EVENT_FEE";
  base_amount: number;
  fee_rate?: number | null;
  fee_amount: number;
  total_amount: number;
  payment_method?: "APPLE_PAY" | "GOOGLE_PAY" | "ADMIN_MANUAL" | null;
  payment_status: MarketplacePaymentStatus;
  processor_transaction_id?: string | null;
  manually_marked_paid?: boolean;
  marked_paid_by_admin_user_id?: string | null;
  marked_paid_at?: string | null;
  manual_payment_reference?: string | null;
  manual_payment_note?: string | null;
  created_at?: string;
  marketplaceEvent?: {
    event_id: string;
    event_name: string;
    customer_user_id: string;
  } | null;
  marketplaceBid?: {
    bid_id: string;
    vendor_user_id: string;
    food_truck_id: string;
    bid_status: string;
    full_bid_amount?: number;
  } | null;
}

class MarketplaceApiService extends BaseAPI {
  listRepositoryFiles(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    attachment_type?: string;
  }) {
    return this.getPaginated<MarketplaceRepositoryFile>(
      `${APIEndpoint.MARKETPLACE}/repository/files`,
      "marketplaceRepositoryFileList",
      { params },
    );
  }

  accessFile(attachmentId: string, download = false) {
    return this.get<
      IResponse<{ file_url: string; file_key?: string | null; action: string }>
    >(`${APIEndpoint.MARKETPLACE}/repository/files/${attachmentId}/access`, {
      params: { download },
    });
  }

  updateFileStatus(
    attachmentId: string,
    status: Exclude<MarketplaceFileStatus, "ACTIVE">,
    reason: string,
  ) {
    return this.patch<
      IResponse<{ marketplaceRepositoryFile: MarketplaceRepositoryFile }>
    >(`${APIEndpoint.MARKETPLACE}/repository/files/${attachmentId}/status`, {
      status,
      reason,
    });
  }

  listPayments(params: {
    page: number;
    limit: number;
    payment_status?: MarketplacePaymentStatus;
    payment_type?: string;
  }) {
    return this.getPaginated<MarketplacePayment>(
      `${APIEndpoint.MARKETPLACE}/payments`,
      "marketplacePaymentList",
      { params },
    );
  }

  markPaymentPaid(
    paymentId: string,
    payload: {
      manual_payment_reference?: string;
      manual_payment_note: string;
    },
  ) {
    return this.post<IResponse<{ marketplacePayment: MarketplacePayment }>>(
      `${APIEndpoint.MARKETPLACE}/payments/${paymentId}/admin-mark-paid`,
      payload,
    );
  }
}

export const marketplaceApiService = new MarketplaceApiService();
