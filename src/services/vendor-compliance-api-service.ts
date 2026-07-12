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
}

export const vendorComplianceApiService = new VendorComplianceApiService();
