import { APIEndpoint } from "@/models/api-endpoint";
import { BaseAPI } from "./base-api";

export type ComplianceDocument = {
  document_id: string;
  food_truck_id?: any;
  vendor_user_id?: any;
  document_type: string;
  version: number;
  title?: string | null;
  file_url: string;
  file_key?: string | null;
  original_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  issue_date?: string | null;
  expiration_date?: string | null;
  extracted_fields?: Record<string, any>;
  ocr_status: string;
  ocr_error_message?: string | null;
  review_status: string;
  review_notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ComplianceDashboard = {
  total_documents: number;
  pending_review: number;
  verified: number;
  rejected: number;
  expired: number;
  expiring_soon: number;
  by_review_status: Record<string, number>;
  by_document_type: Record<string, number>;
  by_score_color?: Record<string, number>;
  vendor_scores?: VendorComplianceScore[];
};

export type VendorComplianceScore = {
  food_truck_id: string;
  vendor_user_id?: string | null;
  vendor_name: string;
  vendor_email?: string | null;
  plan_name?: string | null;
  score: number;
  score_color: "red" | "yellow" | "blue" | "green" | string;
  score_color_hex?: string;
  score_label: string;
  eligible: boolean;
  missing_requirements?: string[];
  expiring_requirements?: string[];
  pending_requirements?: string[];
  rejected_requirements?: string[];
};

class VendorComplianceApiService extends BaseAPI {
  getDashboard() {
    return this.get<{ data: { dashboard: ComplianceDashboard } }>(
      `${APIEndpoint.VENDOR_COMPLIANCE}/admin/dashboard`,
    );
  }

  listDocuments(params?: {
    page?: number;
    limit?: number;
    review_status?: string;
    document_type?: string;
  }) {
    return this.get<{
      data: {
        complianceDocumentList: ComplianceDocument[];
        total: number;
        page: number;
        totalPages: number;
      };
    }>(`${APIEndpoint.VENDOR_COMPLIANCE}/admin/documents`, { params });
  }

  reviewDocument(
    documentId: string,
    payload: {
      review_status: "verified" | "rejected" | "expired";
      review_notes?: string;
      expiration_date?: string;
      issue_date?: string;
      extracted_fields?: Record<string, any>;
    },
  ) {
    return this.patch(
      `${APIEndpoint.VENDOR_COMPLIANCE}/admin/documents/${documentId}/review`,
      payload,
    );
  }

  uploadDocument(
    foodTruckId: string,
    file: File,
    data: { title?: string; document_type: string; replace_existing?: boolean },
  ) {
    const fd = new FormData();
    fd.append("file", file);
    if (data.title) fd.append("title", data.title);
    fd.append("document_type", data.document_type);
    if (data.replace_existing) fd.append("replace_existing", "true");

    return this.post(
      `${APIEndpoint.VENDOR_COMPLIANCE}/food-truck/${foodTruckId}/documents`,
      fd,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  }
}

export const vendorComplianceApiService = new VendorComplianceApiService();
