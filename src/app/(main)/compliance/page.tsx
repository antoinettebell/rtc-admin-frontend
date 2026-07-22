"use client";

import * as React from "react";
import dayjs from "dayjs";
import { CheckCircle2, ExternalLink, Gauge, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ComplianceDocument,
  vendorComplianceApiService,
} from "@/services/vendor-compliance-api-service";

const statusColors: Record<string, string> = {
  pending_review: "bg-yellow-100 text-yellow-900",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-yellow-100 text-yellow-900",
  archived: "bg-slate-100 text-slate-700",
};

const documentTypeOptions = [
  { value: "HEALTH_PERMIT", label: "Sanitation Grade" },
  { value: "BUSINESS_LICENSE", label: "Business License/Permit" },
  { value: "COI", label: "Certificate of Insurance" },
  { value: "LIQUOR_LICENSE", label: "Liquor License" },
  { value: "EIN", label: "EIN" },
  { value: "W9", label: "W-9" },
];

const scoreColorClasses: Record<string, string> = {
  red: "bg-red-100 text-red-800 border-red-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  yellow: "bg-yellow-100 text-yellow-900 border-yellow-200",
  green: "bg-green-100 text-green-800 border-green-200",
};

const scoreBarClasses: Record<string, string> = {
  red: "bg-red-600",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  green: "bg-green-600",
};

const acronymLabels: Record<string, string> = {
  COI: "COI",
  EIN: "EIN",
  ID: "ID",
  OCR: "OCR",
  SSN: "SSN",
  W9: "W-9",
  W_9: "W-9",
};

const formatLabel = (value?: string | null) => {
  if (/^HEALTH_PERMIT$/i.test(String(value || ""))) {
    return "Sanitation Grade";
  }

  if (/^BUSINESS_LICENSE$/i.test(String(value || ""))) {
    return "Business License/Permit";
  }

  return String(value || "-")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\b(Coi|Ein|Id|Ocr|Ssn|W9|W 9)\b/g, (match) => {
      const key = match.replace(" ", "_").toUpperCase();
      return acronymLabels[key] || match.toUpperCase();
    });
};

const getVendorName = (document: ComplianceDocument) => {
  const truck = document.food_truck_id;
  if (truck && typeof truck === "object") {
    return truck.name || truck.businessName || truck._id || "-";
  }
  return truck || "-";
};

export default function CompliancePage() {
  const [reviewStatus, setReviewStatus] = React.useState("");
  const [documentType, setDocumentType] = React.useState("");
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["vendor-compliance-dashboard"],
    queryFn: () => vendorComplianceApiService.getDashboard(),
    refetchOnWindowFocus: false,
  });

  const documentsQuery = useQuery({
    queryKey: ["vendor-compliance-documents", reviewStatus, documentType],
    queryFn: () =>
      vendorComplianceApiService.listDocuments({
        page: 1,
        limit: 50,
        review_status: reviewStatus || undefined,
        document_type: documentType || undefined,
      }),
    refetchOnWindowFocus: false,
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      document,
      nextStatus,
    }: {
      document: ComplianceDocument;
      nextStatus: "verified" | "rejected" | "expired";
    }) =>
      vendorComplianceApiService.reviewDocument(document.document_id, {
        review_status: nextStatus,
        expiration_date: document.expiration_date || undefined,
      }),
    onSuccess: () => {
      toast.success("Compliance document updated");
      dashboardQuery.refetch();
      documentsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Unable to update document");
    },
    onSettled: () => {
      setUpdatingId(null);
    },
  });

  const dashboard = dashboardQuery.data?.data?.data?.dashboard;
  const documentData = documentsQuery.data?.data?.data;
  const documents =
    documentData?.complianceDocumentList || documentData?.records || [];
  const visibleDocuments = documents.filter(
    (document) =>
      !["archived", "rejected"].includes(
        String(document.review_status || "").toLowerCase(),
      ),
  );
  const documentTotal = visibleDocuments.length;
  const vendorScores = dashboard?.vendor_scores || [];
  const documentsError =
    (documentsQuery.error as any)?.response?.data?.message ||
    (documentsQuery.error as any)?.message;

  const updateDocument = (
    document: ComplianceDocument,
    nextStatus: "verified" | "rejected" | "expired",
  ) => {
    setUpdatingId(document.document_id);
    reviewMutation.mutate({ document, nextStatus });
  };

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Vendor Compliance
          </h1>
          <p className="text-sm text-muted-foreground">
            Review loaded vendor documents by compliance bucket, OCR status, and approval status.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            dashboardQuery.refetch();
            documentsQuery.refetch();
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Total", dashboard?.total_documents || 0],
          ["Pending", dashboard?.pending_review || 0],
          ["Verified", dashboard?.verified || 0],
          ["Rejected", dashboard?.rejected || 0],
          ["Expired", dashboard?.expired || 0],
          ["Expiring Soon", dashboard?.expiring_soon || 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-background p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="flex items-center gap-2 font-medium">
            <Gauge className="h-4 w-4" />
            Vendor Compliance Scores
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["red", "0-24%"],
              ["orange", "25-49%"],
              ["yellow", "50-74%"],
              ["green", "75-100%"],
            ].map(([color, label]) => (
              <Badge
                key={color}
                variant="outline"
                className={scoreColorClasses[color]}
              >
                {label}: {dashboard?.by_score_color?.[color] || 0}
              </Badge>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Vendor</th>
                <th className="p-3 font-medium">Score</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Open Items</th>
                <th className="p-3 font-medium">Plan</th>
              </tr>
            </thead>
            <tbody>
              {vendorScores.map((vendor) => {
                const openItems = [
                  ...(vendor.missing_requirements || []).map(
                    (item) => `Missing ${formatLabel(item)}`,
                  ),
                  ...(vendor.pending_requirements || []).map(
                    (item) => `Pending ${formatLabel(item)}`,
                  ),
                  ...(vendor.rejected_requirements || []).map(
                    (item) => `Rejected ${formatLabel(item)}`,
                  ),
                  ...(vendor.expiring_requirements || []).map(
                    (item) => `${formatLabel(item)} expiring soon`,
                  ),
                ];
                const score = Math.max(0, Math.min(100, Number(vendor.score) || 0));

                return (
                  <tr key={vendor.food_truck_id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{vendor.vendor_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {vendor.vendor_email || vendor.food_truck_id}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-36 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${
                              scoreBarClasses[vendor.score_color] || "bg-slate-500"
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="w-10 font-semibold">{score}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={
                          scoreColorClasses[vendor.score_color] ||
                          "bg-slate-100 text-slate-700"
                        }
                      >
                        {vendor.score_label}
                      </Badge>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {vendor.eligible ? "Eligible" : "Not eligible"}
                      </div>
                      {vendor.grandfathered ? (
                        <Badge variant="secondary" className="mt-2">
                          Grandfathered
                        </Badge>
                      ) : null}
                    </td>
                    <td className="p-3">
                      {openItems.length ? (
                        <div className="flex max-w-xl flex-wrap gap-1">
                          {openItems.slice(0, 5).map((item) => (
                            <Badge key={item} variant="secondary">
                              {item}
                            </Badge>
                          ))}
                          {openItems.length > 5 ? (
                            <Badge variant="secondary">
                              +{openItems.length - 5} more
                            </Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="p-3">{vendor.plan_name || "-"}</td>
                  </tr>
                );
              })}
              {!vendorScores.length ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No vendor compliance scores found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4" />
            Document Review
            <Badge variant="secondary">{documentTotal} found</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">All documents</option>
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={reviewStatus}
              onChange={(event) => setReviewStatus(event.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="pending_review">Pending review</option>
              <option value="verified">Verified</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {documentsError ? (
          <div className="border-b bg-red-50 p-3 text-sm text-red-700">
            {documentsError}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Vendor</th>
                <th className="p-3 font-medium">Document</th>
                <th className="p-3 font-medium">OCR</th>
                <th className="p-3 font-medium">Expires</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Uploaded</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleDocuments.map((document) => (
                <tr key={document.document_id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{getVendorName(document)}</div>
                    <div className="text-xs text-muted-foreground">
                      {document.document_id}
                    </div>
                  </td>
                  <td className="p-3">
                    <div>{formatLabel(document.document_type)}</div>
                    <div className="text-xs text-muted-foreground">
                      v{document.version} · {document.original_name || "Uploaded file"}
                    </div>
                  </td>
                  <td className="p-3">{formatLabel(document.ocr_status)}</td>
                  <td className="p-3">
                    {document.expiration_date
                      ? dayjs(document.expiration_date).format("YYYY-MM-DD")
                      : "-"}
                  </td>
                  <td className="p-3">
                    <Badge
                      className={
                        statusColors[document.review_status] ||
                        "bg-slate-100 text-slate-700"
                      }
                    >
                      {formatLabel(document.review_status)}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {document.created_at
                      ? dayjs(document.created_at).format("YYYY-MM-DD HH:mm")
                      : "-"}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(document.file_url, "_blank", "noopener,noreferrer")
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        disabled={updatingId === document.document_id}
                        onClick={() => updateDocument(document, "verified")}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Verify
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={updatingId === document.document_id}
                        onClick={() => updateDocument(document, "rejected")}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleDocuments.length ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No compliance documents found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
