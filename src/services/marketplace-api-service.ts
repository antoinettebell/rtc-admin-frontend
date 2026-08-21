import { BaseAPI } from "./base-api";
import { APIEndpoint } from "@/models/api-endpoint";
import { IResponse } from "@/interfaces/response-interface";

export type MarketplacePaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type EventVendorReviewStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED";

export interface AdminEventVendorProfile {
  profile_id: string;
  vendor_user_id?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    countryCode?: string;
    mobileNumber?: string;
  } | null;
  business_name?: string;
  business_description?: string;
  vendor_types?: string[];
  merchandise_categories?: string[];
  social_links?: string[];
  logo_url?: string | null;
  review_status: EventVendorReviewStatus;
  rejection_reason?: string | null;
  submitted_at?: string | null;
  submission_count?: number;
}

export interface AdminEventVendorPhoto {
  photo_id: string;
  category?: string | null;
  file_url: string;
  original_name?: string | null;
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

export type MarketplaceSubmissionType =
  | "FOOD_BID"
  | "FOOD_APPLICATION"
  | "MARKETPLACE_APPLICATION";

export interface MarketplaceSubmissionSummary {
  submission_type: MarketplaceSubmissionType;
  submission_id: string;
  status: string;
  vendor_name?: string | null;
  business_name?: string | null;
  vendor_types?: string[];
  vendor_user_id?: string | null;
  food_truck_id?: string | null;
  event_vendor_profile_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MarketplaceSubmissionAttachment {
  attachment_id: string;
  attachment_type?: string | null;
  requirement_label?: string | null;
  original_name?: string | null;
  file_url: string;
  status?: string | null;
  created_at?: string | null;
}

export interface MarketplaceSubmissionDetail {
  marketplaceEvent: MarketplaceRepositoryEvent;
  submission: Record<string, any>;
  submission_type: MarketplaceSubmissionType;
  submission_id: string;
  vendor_profile_id?: string | null;
  status: string;
  profile?: Record<string, any> | null;
  attachments: MarketplaceSubmissionAttachment[];
  editable_fields: string[];
  locked_fields: string[];
  admin_draft?: {
    payload?: Record<string, any>;
    reason?: string | null;
    validation_errors?: Array<{ field: string; message: string }>;
  } | null;
  revoke_allowed?: boolean;
  revoke_block_reason?: string | null;
}

export interface MarketplaceAdminDraft {
  payload?: Record<string, any>;
  reason?: string | null;
  validation_errors?: Array<{ field: string; message: string }>;
}

export type MarketplaceEventVisibility = "PUBLIC" | "PRIVATE";
export type MarketplacePaymentResponsibility =
  | "COORDINATOR"
  | "VENDOR"
  | "BOTH"
  | "NONE";

export interface MarketplaceEventPayload {
  event_name?: string | null;
  event_description?: string | null;
  ticket_sales_enabled?: boolean;
  ga_ticket_quantity?: number;
  ga_ticket_price?: number;
  vip_ticket_quantity?: number;
  vip_ticket_price?: number;
  ticket_url?: string | null;
  event_type?: string | null;
  event_type_other?: string | null;
  event_visibility?: MarketplaceEventVisibility;
  event_style?: string | null;
  service_type?: string | null;
  service_types?: string[];
  service_styles?: string[];
  primary_service_style?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  event_timezone?: string | null;
  charitable_event?: boolean;
  religious_organization?: boolean;
  event_duration_hours?: number | null;
  event_duration_minutes?: number | null;
  event_address?: string | null;
  event_city?: string | null;
  event_state?: string | null;
  event_zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  formatted_address?: string | null;
  geocoded_address?: string | null;
  place_id?: string | null;
  geocoding_provider?: string | null;
  geocoded_at?: string | null;
  number_of_guests?: number | null;
  number_of_vendors_needed?: number | null;
  power_required?: string[];
  permits_required?: string[];
  insurance_required?: boolean;
  alcohol_required?: boolean;
  free_food_offered?: boolean | null;
  free_food_provider?: string | null;
  vendors_required_to_giveaway_food?: boolean | null;
  catered_vip_section_enabled?: boolean;
  vip_section_enabled?: boolean;
  vip_section_details?: string | null;
  fully_catered_event?: boolean;
  ga_food_sales_allowed?: boolean | null;
  waive_vendor_fee_for_combined_award?: boolean | null;
  vendor_fee_payment_deadline?: string | null;
  separate_vip_vendor_required?: boolean;
  vip_guest_count?: number | null;
  event_vendor_needs?: Array<{ vendor_type: "MERCHANDISE" | "SERVICE" | "OTHER"; type_description?: string | null; quantity: number; fee: number }>;
  event_vendor_electricity_fee?: number;
  cuisine_preferences?: string[];
  dietary_restrictions?: string[];
  equipment_needed?: string[];
  plated_number_of_courses?: string | null;
  plated_options?: string[];
  plated_entree_selection?: string | null;
  plated_included_items?: string[];
  plated_single_entree?: boolean;
  plated_choice_entrees?: boolean;
  plated_tableside_choice?: boolean;
  plated_bread_salad_dessert?: boolean;
  buffet_options?: string[];
  buffet_setup?: string | null;
  buffet_included_items?: string[];
  food_truck_options?: string[];
  station_setup_type?: string | null;
  station_included_items?: string[];
  service_notes?: string | null;
  vendor_fee?: number;
  budgeted_amount?: number;
  payment_responsibility?: MarketplacePaymentResponsibility;
  event_close_date?: string | null;
  event_close_time?: string | null;
  status?: string;
  admin_reason?: string;
  save_mode?: "DRAFT" | "PUBLISH";
}

export interface MarketplaceRepositoryEvent {
  event_id: string;
  event_name: string;
  event_description?: string | null;
  status: string;
  admin_draft?: {
    payload?: Record<string, any>;
    reason?: string | null;
    validation_errors?: Array<{ field: string; message: string }>;
  } | null;
  event_visibility?: string | null;
  event_type?: string | null;
  event_type_other?: string | null;
  event_style?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  event_timezone?: string | null;
  charitable_event?: boolean;
  religious_organization?: boolean;
  event_duration_hours?: number | null;
  event_duration_minutes?: number | null;
  event_address?: string | null;
  event_city?: string | null;
  event_state?: string | null;
  event_zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  formatted_address?: string | null;
  geocoded_address?: string | null;
  place_id?: string | null;
  geocoding_provider?: string | null;
  geocoded_at?: string | null;
  service_type?: string | null;
  service_types?: string[];
  service_styles?: string[];
  primary_service_style?: string | null;
  number_of_guests?: number | null;
  number_of_vendors_needed?: number | null;
  power_required?: string[];
  permits_required?: string[];
  insurance_required?: boolean;
  alcohol_required?: boolean;
  free_food_offered?: boolean | null;
  free_food_provider?: string | null;
  vendors_required_to_giveaway_food?: boolean | null;
  catered_vip_section_enabled?: boolean;
  vip_section_enabled?: boolean;
  vip_section_details?: string | null;
  fully_catered_event?: boolean;
  ga_food_sales_allowed?: boolean | null;
  waive_vendor_fee_for_combined_award?: boolean | null;
  vendor_fee_payment_deadline?: string | null;
  separate_vip_vendor_required?: boolean;
  vip_guest_count?: number | null;
  ga_ticket_quantity?: number | null;
  ga_ticket_price?: number | null;
  vip_ticket_quantity?: number | null;
  vip_ticket_price?: number | null;
  event_vendor_needs?: Array<{ vendor_type: "MERCHANDISE" | "SERVICE" | "OTHER"; type_description?: string | null; quantity: number; fee: number }>;
  event_vendor_electricity_fee?: number | null;
  cuisine_preferences?: string[];
  dietary_restrictions?: string[];
  equipment_needed?: string[];
  plated_number_of_courses?: string | null;
  plated_options?: string[];
  plated_entree_selection?: string | null;
  plated_included_items?: string[];
  plated_single_entree?: boolean;
  plated_choice_entrees?: boolean;
  plated_tableside_choice?: boolean;
  plated_bread_salad_dessert?: boolean;
  buffet_options?: string[];
  buffet_setup?: string | null;
  buffet_included_items?: string[];
  food_truck_options?: string[];
  station_setup_type?: string | null;
  station_included_items?: string[];
  service_notes?: string | null;
  vendor_fee?: number | null;
  budgeted_amount?: number | null;
  payment_responsibility?: MarketplacePaymentResponsibility;
  event_close_date?: string | null;
  event_close_time?: string | null;
  ticket_sales_enabled?: boolean;
  ticket_url?: string | null;
  customer_user_id?: any;
  images?: MarketplaceEventImage[];
  bids?: MarketplaceSubmission[];
  applications?: MarketplaceSubmission[];
  submission_summaries?: MarketplaceSubmissionSummary[];
  bid_count?: number;
  food_application_count?: number;
  marketplace_application_count?: number;
  submission_count?: number;
  application_count?: number;
  created_at?: string;
}

export interface MarketplaceTaxExemption {
  event_id: string;
  event_name: string;
  event_date?: string | null;
  charitable_event: boolean;
  religious_organization: boolean;
  tax_exemption_status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  tax_exemption_entity_use_code?: "E" | "F" | null;
  customer_user_id?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    eventCoordinatorCompanyName?: string;
  } | string;
  certificate?: {
    attachment_id: string;
    file_url: string;
    original_name?: string | null;
    created_at?: string;
  } | null;
}

class MarketplaceApiService extends BaseAPI {
  listTaxExemptions(status = "PENDING") {
    return this.get<IResponse<{ taxExemptionList: MarketplaceTaxExemption[] }>>(
      `${APIEndpoint.MARKETPLACE}/repository/tax-exemptions`,
      { params: { status } },
    );
  }

  reviewTaxExemption(
    eventId: string,
    payload: {
      status: "APPROVED" | "REJECTED";
      expiration_date?: string | null;
      review_notes?: string;
    },
  ) {
    return this.patch<IResponse<{ marketplaceEvent: MarketplaceRepositoryEvent }>>(
      `${APIEndpoint.MARKETPLACE}/repository/tax-exemptions/${eventId}/review`,
      payload,
    );
  }

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
    payload: MarketplaceEventPayload,
  ) {
    return this.patch<
      IResponse<{ marketplaceEvent: MarketplaceRepositoryEvent }>
    >(`${APIEndpoint.MARKETPLACE}/repository/events/${eventId}`, payload);
  }

  createRepositoryEvent(payload: MarketplaceEventPayload & {
    customer_user_id?: string;
    save_mode: "DRAFT" | "PUBLISH";
  }) {
    return this.post<
      IResponse<{
        marketplaceEvent?: MarketplaceRepositoryEvent;
        adminDraft?: MarketplaceAdminDraft;
      }>
    >(`${APIEndpoint.MARKETPLACE}/repository/events`, payload);
  }

  getRepositoryNewEventDraft() {
    return this.get<IResponse<{ adminDraft: MarketplaceAdminDraft | null }>>(
      `${APIEndpoint.MARKETPLACE}/repository/events/new-draft`,
    );
  }

  getRepositorySubmission(
    eventId: string,
    submissionType: MarketplaceSubmissionType,
    submissionId: string,
  ) {
    return this.get<IResponse<MarketplaceSubmissionDetail>>(
      `${APIEndpoint.MARKETPLACE}/repository/events/${eventId}/submissions/${submissionType}/${submissionId}`,
    );
  }

  updateRepositorySubmission(
    eventId: string,
    submissionType: MarketplaceSubmissionType,
    submissionId: string,
    payload: Record<string, unknown> & {
      admin_reason: string;
      save_mode: "DRAFT" | "PUBLISH";
    },
  ) {
    return this.patch<IResponse<{ marketplaceSubmission: Record<string, any> }>>(
      `${APIEndpoint.MARKETPLACE}/repository/events/${eventId}/submissions/${submissionType}/${submissionId}`,
      payload,
    );
  }

  actionRepositorySubmission(
    eventId: string,
    submissionType: MarketplaceSubmissionType,
    submissionId: string,
    action: "WITHDRAW" | "ARCHIVE" | "DELETE" | "REVOKE",
    adminReason: string,
  ) {
    return this.post<IResponse<{ marketplaceSubmission: Record<string, any> }>>(
      `${APIEndpoint.MARKETPLACE}/repository/events/${eventId}/submissions/${submissionType}/${submissionId}/actions`,
      { action, reason: adminReason },
    );
  }

  replaceRepositorySubmissionAttachment(
    eventId: string,
    submissionType: MarketplaceSubmissionType,
    submissionId: string,
    attachmentId: string,
    file: File,
    adminReason: string,
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("admin_reason", adminReason);
    return this.post<
      IResponse<{
        marketplaceAttachment: MarketplaceSubmissionAttachment;
        marketplaceSubmission: Record<string, any>;
      }>
    >(
      `${APIEndpoint.MARKETPLACE}/repository/events/${eventId}/submissions/${submissionType}/${submissionId}/attachments/${attachmentId}/replace`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  }

  deleteEventImage(eventId: string, imageId: string) {
    return this.delete<IResponse<{ image_id: string }>>(
      `${APIEndpoint.MARKETPLACE}/events/${eventId}/images/${imageId}`,
    );
  }

  accessFile(attachmentId: string, download = false) {
    return this.get<
      IResponse<{ file_url: string; file_key?: string | null; action: string }>
    >(`${APIEndpoint.MARKETPLACE}/repository/files/${attachmentId}/access`, {
      params: { download },
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

  listEventVendorProfiles(status: EventVendorReviewStatus | "", page = 1, limit = 20) {
    return this.get<
      IResponse<{
        profileList: AdminEventVendorProfile[];
        total: number;
        page: number;
        totalPages: number;
      }>
    >(`${APIEndpoint.MARKETPLACE}/admin/event-vendors`, {
      params: { page, limit, ...(status ? { status } : {}) },
    });
  }

  getEventVendorProfile(profileId: string) {
    return this.get<
      IResponse<{
        eventVendorProfile: AdminEventVendorProfile;
        photoList: AdminEventVendorPhoto[];
      }>
    >(`${APIEndpoint.MARKETPLACE}/admin/event-vendors/${profileId}`);
  }

  reviewEventVendorProfile(
    profileId: string,
    reviewStatus: "APPROVED" | "REJECTED",
    rejectionReason = "",
  ) {
    return this.put<IResponse<{ eventVendorProfile: AdminEventVendorProfile }>>(
      `${APIEndpoint.MARKETPLACE}/admin/event-vendors/${profileId}/review`,
      { review_status: reviewStatus, rejection_reason: rejectionReason },
    );
  }
}

export const marketplaceApiService = new MarketplaceApiService();
