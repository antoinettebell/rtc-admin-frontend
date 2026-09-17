"use client";

import * as React from "react";
import dayjs from "dayjs";
import { CheckCircle2, ExternalLink, FileText, RefreshCw, Save, Upload, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ComplianceDocument,
  vendorComplianceApiService,
} from "@/services/vendor-compliance-api-service";

const expirationDocumentTypes = new Set([
  "BUSINESS_LICENSE",
  "COI",
  "LIQUOR_LICENSE",
]);

const documentLabels: Record<string, string> = {
  HEALTH_PERMIT: "Sanitation Grade",
  BUSINESS_LICENSE: "Business License/Permit",
  COI: "Certificate of Insurance",
  LIQUOR_LICENSE: "Liquor License",
  EIN: "EIN",
  W9: "W-9",
};

const statusClasses: Record<string, string> = {
  pending_review: "bg-yellow-100 text-yellow-900",
  verified: "bg-green-100 text-green-800",
  expired: "bg-orange-100 text-orange-800",
  rejected: "bg-red-100 text-red-800",
};

type DateDraft = {
  issueDate: string;
  expirationDate: string;
};

const dateValue = (value?: string | null) =>
  value ? String(value).slice(0, 10) : "";

const formatStatus = (value?: string | null) =>
  String(value || "unknown")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const sanitationGrade = (document: ComplianceDocument) => {
  const fields = document.extracted_fields || {};
  return fields.sanitation_grade
    || fields.manual_sanitation_grade
    || fields.grade
    || fields.letter_grade
    || null;
};

export function VendorComplianceTab({ foodTruckId }: { foodTruckId: string }) {
  const [dateDrafts, setDateDrafts] = React.useState<Record<string, DateDraft>>({});
  const [replacementFiles, setReplacementFiles] = React.useState<Record<string, File | null>>({});
  const [workingId, setWorkingId] = React.useState<string | null>(null);

  const documentsQuery = useQuery({
    queryKey: ["vendor-compliance-documents", foodTruckId],
    queryFn: () => vendorComplianceApiService.listDocuments({
      page: 1,
      limit: 100,
      food_truck_id: foodTruckId,
    }),
    enabled: !!foodTruckId,
    refetchOnWindowFocus: false,
  });

  const documents = React.useMemo(() => {
    const records = documentsQuery.data?.data?.data?.complianceDocumentList
      || documentsQuery.data?.data?.data?.records
      || [];
    const latestByType = new Map<string, ComplianceDocument>();
    records.forEach((document) => {
      if (!latestByType.has(document.document_type)) {
        latestByType.set(document.document_type, document);
      }
    });
    return Array.from(latestByType.values());
  }, [documentsQuery.data]);

  React.useEffect(() => {
    const nextDrafts: Record<string, DateDraft> = {};
    documents.forEach((document) => {
      nextDrafts[document.document_id] = {
        issueDate: dateValue(document.issue_date),
        expirationDate: dateValue(document.expiration_date),
      };
    });
    setDateDrafts(nextDrafts);
  }, [documents]);

  const refresh = async () => {
    await documentsQuery.refetch();
  };

  const updateDraft = (
    documentId: string,
    field: keyof DateDraft,
    value: string,
  ) => {
    setDateDrafts((current) => ({
      ...current,
      [documentId]: {
        issueDate: current[documentId]?.issueDate || "",
        expirationDate: current[documentId]?.expirationDate || "",
        [field]: value,
      },
    }));
  };

  const datePayload = (document: ComplianceDocument) => {
    const draft = dateDrafts[document.document_id] || {
      issueDate: dateValue(document.issue_date),
      expirationDate: dateValue(document.expiration_date),
    };
    return {
      issue_date: draft.issueDate || null,
      expiration_date:
        document.document_type === "HEALTH_PERMIT"
          ? null
          : draft.expirationDate || null,
    };
  };

  const saveDates = async (document: ComplianceDocument) => {
    setWorkingId(document.document_id);
    try {
      await vendorComplianceApiService.updateDocumentDates(
        document.document_id,
        datePayload(document),
      );
      toast.success("Compliance dates updated");
      await refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update compliance dates");
    } finally {
      setWorkingId(null);
    }
  };

  const reviewDocument = async (
    document: ComplianceDocument,
    reviewStatus: "verified" | "rejected",
  ) => {
    if (
      reviewStatus === "rejected"
      && !window.confirm("Reject this document and require the vendor to replace it?")
    ) {
      return;
    }
    setWorkingId(document.document_id);
    try {
      await vendorComplianceApiService.reviewDocument(document.document_id, {
        review_status: reviewStatus,
        ...datePayload(document),
      });
      toast.success(reviewStatus === "verified" ? "Document verified" : "Document rejected");
      await refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to review document");
    } finally {
      setWorkingId(null);
    }
  };

  const replaceDocument = async (document: ComplianceDocument) => {
    const file = replacementFiles[document.document_id];
    if (!file) {
      toast.error("Choose a replacement file first");
      return;
    }
    const dates = datePayload(document);
    setWorkingId(document.document_id);
    try {
      await vendorComplianceApiService.uploadDocument(foodTruckId, file, {
        title: document.title || documentLabels[document.document_type] || "Compliance Document",
        document_type: document.document_type,
        replace_existing: true,
        issue_date: dates.issue_date,
        expiration_date: dates.expiration_date,
        sanitation_grade:
          document.document_type === "HEALTH_PERMIT"
            ? sanitationGrade(document)
            : null,
        review_status: "pending_review",
      });
      toast.success("Replacement uploaded and ready for verification");
      setReplacementFiles((current) => ({ ...current, [document.document_id]: null }));
      await refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to replace document");
    } finally {
      setWorkingId(null);
    }
  };

  if (documentsQuery.isLoading) {
    return <div className="rounded-lg border p-6 text-sm text-muted-foreground">Loading compliance documents…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Compliance Documents</h2>
          <p className="text-sm text-muted-foreground">
            Correct dates, replace files, and verify or reject documents for this vendor.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={documentsQuery.isFetching}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {!documents.length ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No compliance documents have been uploaded for this vendor.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {documents.map((document) => {
          const isSanitation = document.document_type === "HEALTH_PERMIT";
          const hasExpiration = expirationDocumentTypes.has(document.document_type);
          const draft = dateDrafts[document.document_id] || {
            issueDate: dateValue(document.issue_date),
            expirationDate: dateValue(document.expiration_date),
          };
          const isWorking = workingId === document.document_id;
          const documentUrl = document.access_url || document.file_url;
          const isImage = String(document.mime_type || "").startsWith("image/");

          return (
            <section key={document.document_id} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {documentLabels[document.document_type] || document.title || document.document_type}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Version {document.version} · Uploaded {document.created_at
                      ? dayjs(document.created_at).format("MMM D, YYYY h:mm A")
                      : "date unavailable"}
                  </div>
                </div>
                <Badge className={statusClasses[document.review_status] || "bg-slate-100 text-slate-700"}>
                  {formatStatus(document.review_status)}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
                  {isImage && documentUrl ? (
                    // The document URL is dynamic and may be an expiring signed URL.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={documentUrl}
                      alt={document.title || documentLabels[document.document_type] || "Compliance document"}
                      className="h-36 w-full object-contain"
                    />
                  ) : (
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">
                        {isSanitation ? "Inspection Date" : "Issue Date"}
                      </span>
                      <Input
                        type="date"
                        value={draft.issueDate}
                        max={isSanitation ? dayjs().format("YYYY-MM-DD") : undefined}
                        onChange={(event) => updateDraft(
                          document.document_id,
                          "issueDate",
                          event.target.value,
                        )}
                      />
                    </label>
                    {hasExpiration ? (
                      <label className="space-y-1 text-sm">
                        <span className="font-medium">Expiration Date</span>
                        <Input
                          type="date"
                          value={draft.expirationDate}
                          onChange={(event) => updateDraft(
                            document.document_id,
                            "expirationDate",
                            event.target.value,
                          )}
                        />
                      </label>
                    ) : null}
                  </div>

                  {isSanitation && sanitationGrade(document) ? (
                    <div className="text-sm">
                      <span className="font-medium">Sanitation Grade:</span>{" "}
                      {String(sanitationGrade(document)).toUpperCase()}
                    </div>
                  ) : null}
                  <div className="text-xs text-muted-foreground">
                    OCR: {formatStatus(document.ocr_status)}
                    {document.ocr_error_message ? ` — ${document.ocr_error_message}` : ""}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-md border bg-muted/20 p-3">
                <div className="mb-2 text-sm font-medium">Replace document</div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    className="min-w-64 flex-1"
                    onChange={(event) => setReplacementFiles((current) => ({
                      ...current,
                      [document.document_id]: event.target.files?.[0] || null,
                    }))}
                  />
                  <Button
                    variant="outline"
                    disabled={isWorking || !replacementFiles[document.document_id]}
                    onClick={() => replaceDocument(document)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Replacement
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(documentUrl, "_blank", "noopener,noreferrer")}
                  disabled={!documentUrl}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Button>
                <Button variant="outline" disabled={isWorking} onClick={() => saveDates(document)}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Dates
                </Button>
                <Button disabled={isWorking} onClick={() => reviewDocument(document, "verified")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify
                </Button>
                <Button
                  variant="destructive"
                  disabled={isWorking}
                  onClick={() => reviewDocument(document, "rejected")}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
