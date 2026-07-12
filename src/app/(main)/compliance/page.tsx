"use client";

import * as React from "react";
import dayjs from "dayjs";
import { CheckCircle2, ExternalLink, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ComplianceDocument,
  vendorComplianceApiService,
} from "@/services/vendor-compliance-api-service";

const statusColors: Record<string, string> = {
  pending_review: "bg-blue-100 text-blue-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-yellow-100 text-yellow-900",
  archived: "bg-slate-100 text-slate-700",
};

const formatLabel = (value?: string | null) =>
  (value || "-")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getVendorName = (document: ComplianceDocument) => {
  const truck = document.food_truck_id;
  if (truck && typeof truck === "object") {
    return truck.name || truck.businessName || truck._id || "-";
  }
  return truck || "-";
};

export default function CompliancePage() {
  const [reviewStatus, setReviewStatus] = React.useState("");
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["vendor-compliance-dashboard"],
    queryFn: () => vendorComplianceApiService.getDashboard(),
    refetchOnWindowFocus: false,
  });

  const documentsQuery = useQuery({
    queryKey: ["vendor-compliance-documents", reviewStatus],
    queryFn: () =>
      vendorComplianceApiService.listDocuments({
        page: 1,
        limit: 50,
        review_status: reviewStatus || undefined,
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
  const documents =
    documentsQuery.data?.data?.data?.complianceDocumentList || [];

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
            Health permits, business licenses, COIs, OCR status, and review actions.
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
            <ShieldCheck className="h-4 w-4" />
            Document Review
          </div>
          <select
            value={reviewStatus}
            onChange={(event) => setReviewStatus(event.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending_review">Pending review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>

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
              {documents.map((document) => (
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
              {!documents.length ? (
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
