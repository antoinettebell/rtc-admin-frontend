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
  application_id?: string | null;
  attachment_type: string;
  requirement_label?: string | null;
  requirement_key?: string | null;
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
  marketplaceApplication?: {
    application_id: string;
    vendor_user_id: string;
    food_truck_id: string;
    application_status: string;
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
    | "VENDOR_EVENT_FEE"
    | "FINAL_EVENT_PAYMENT";
  base_amount: number;
  fee_rate?: number | null;
  fee_amount: number;
  tip_amount?: number;
  total_amount: number;
  payment_method?: "APPLE_PAY" | "GOOGLE_PAY" | "TAP_TO_PAY" | "ADMIN_MANUAL" | null;
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

export interface MarketplaceEventImage {
  image_id: string;
  event_id: string;
  image_url: string;
  original_name?: string | null;
  status: string;
}

export interface MarketplaceSubmission {
  bid_id?: string;
  application_id?: string;
  bid_status?: string;
  application_status?: string;
  vendor_user_id?: any;
  food_truck_id?: any;
  full_bid_amount?: number | null;
  menu_description?: string | null;
  created_at?: string;
}

export interface MarketplaceRepositoryEvent {
  event_id: string;
  event_name: string;
  event_description?: string | null;
  status: string;
  event_visibility?: string | null;
  event_date?: string | null;
  event_city?: string | null;
  event_state?: string | null;
  ticket_sales_enabled?: boolean;
  ticket_url?: string | null;
  customer_user_id?: any;
  images?: MarketplaceEventImage[];
  bids?: MarketplaceSubmission[];
  applications?: MarketplaceSubmission[];
  bid_count?: number;
  application_count?: number;
  created_at?: string;
}

class MarketplaceApiService extends BaseAPI {
  listRepositoryEvents(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    return this.getPaginated<MarketplaceRepositoryEvent>(
      `${APIEndpoint.MARKETPLACE}/repository/events`,
      "marketplaceEventList",
      { params },
    );
  }

  updateRepositoryEvent(
    eventId: string,
    payload: {
      event_name?: string | null;
      event_description?: string | null;
      ticket_sales_enabled?: boolean;
      ticket_url?: string | null;
    },
  ) {
    return this.patch<
      IResponse<{ marketplaceEvent: MarketplaceRepositoryEvent }>
    >(`${APIEndpoint.MARKETPLACE}/repository/events/${eventId}`, payload);
  }

  createRepositoryEvent(payload: {
    customer_user_id: string;
    event_name?: string | null;
    event_description?: string | null;
    event_type?: string | null;
    event_visibility?: "PUBLIC" | "PRIVATE";
    event_date?: string | null;
    event_time?: string | null;
    event_address?: string | null;
    event_city?: string | null;
    event_state?: string | null;
    event_zip?: string | null;
    number_of_guests?: number | null;
    number_of_vendors_needed?: number | null;
    payment_responsibility?: "COORDINATOR" | "VENDOR" | "BOTH" | "NONE";
    vendor_fee?: number;
    budgeted_amount?: number;
    event_close_date?: string | null;
    event_close_time?: string | null;
    status?: string;
  }) {
    return this.post<
      IResponse<{ marketplaceEvent: MarketplaceRepositoryEvent }>
    >(`${APIEndpoint.MARKETPLACE}/repository/events`, payload);
  }

  updateEventStatus(eventId: string, status: string) {
    return this.patch<
      IResponse<{ marketplaceEvent: MarketplaceRepositoryEvent }>
    >(`${APIEndpoint.MARKETPLACE}/events/${eventId}/status`, { status });
  }

  awardRepositoryEvent(eventId: string, bidIds: string[]) {
    return this.post<IResponse<any>>(
      `${APIEndpoint.MARKETPLACE}/repository/events/${eventId}/award`,
      { bid_ids: bidIds },
    );
  }

  deleteEventImage(eventId: string, imageId: string) {
    return this.delete<IResponse<{ image_id: string }>>(
      `${APIEndpoint.MARKETPLACE}/events/${eventId}/images/${imageId}`,
    );
  }

  withdrawSubmission(
    eventId: string,
    payload: {
      submission_type: "BID" | "APPLICATION";
      submission_id: string;
      reason?: string;
    },
  ) {
    return this.patch<IResponse<any>>(
      `${APIEndpoint.MARKETPLACE}/repository/events/${eventId}/submissions/withdraw`,
      payload,
    );
  }

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
