"use client";

import * as React from "react";
import dayjs from "dayjs";
import { Archive, CheckCircle2, ChevronDown, ChevronRight, ExternalLink, FileText, Pencil, RefreshCw, Save, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComplianceDocument, vendorComplianceApiService } from "@/services/vendor-compliance-api-service";

const expirationDocumentTypes = new Set(["BUSINESS_LICENSE", "COI", "LIQUOR_LICENSE"]);
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
  archived: "bg-slate-100 text-slate-700",
};

type DateDraft = { issueDate: string; expirationDate: string };
const dateValue = (value?: string | null) => value ? String(value).slice(0, 10) : "";
const formatStatus = (value?: string | null) => String(value || "unknown")
  .replace(/_/g, " ")
  .toLowerCase()
  .replace(/\b\w/g, (letter) => letter.toUpperCase());
const responseDocuments = (response: any): ComplianceDocument[] =>
  response?.data?.data?.complianceDocumentList || response?.data?.data?.records || [];
const sanitationGrade = (document: ComplianceDocument) => {
  const fields = document.extracted_fields || {};
  return fields.sanitation_grade || fields.manual_sanitation_grade || fields.grade || fields.letter_grade || null;
};
const firstExtractedValue = (
  fields: Record<string, any> = {},
  names: string[],
) => {
  for (const name of names) {
    const value = fields[name];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
};
const ocrIssueDate = (document: ComplianceDocument) => firstExtractedValue(
  document.extracted_fields,
  ["issue_date", "issueDate", "issued_date", "issuedDate", "effective_date", "effectiveDate", "inspection_date", "inspectionDate"],
);
const ocrExpirationDate = (document: ComplianceDocument) => firstExtractedValue(
  document.extracted_fields,
  ["expiration_date", "expirationDate", "expiry_date", "expiryDate", "expires_at", "expiresAt", "exp_date", "expDate", "valid_until", "validUntil", "valid_through", "validThrough"],
);
const displayDetectedDate = (value: any) => {
  if (!value) return "Not detected";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : String(value);
};

export function VendorComplianceTab({ foodTruckId }: { foodTruckId: string }) {
  const [dateDrafts, setDateDrafts] = React.useState<Record<string, DateDraft>>({});
  const [replacementFiles, setReplacementFiles] = React.useState<Record<string, File | null>>({});
  const [workingId, setWorkingId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [activeExpanded, setActiveExpanded] = React.useState(true);
  const [archivedExpanded, setArchivedExpanded] = React.useState(false);

  const activeQuery = useQuery({
    queryKey: ["vendor-compliance-documents", foodTruckId, "active"],
    queryFn: () => vendorComplianceApiService.listDocuments({ page: 1, limit: 100, food_truck_id: foodTruckId }),
    enabled: !!foodTruckId,
    refetchOnWindowFocus: false,
  });
  const archivedQuery = useQuery({
    queryKey: ["vendor-compliance-documents", foodTruckId, "archived"],
    queryFn: () => vendorComplianceApiService.listDocuments({
      page: 1,
      limit: 100,
      food_truck_id: foodTruckId,
      archived: true,
    }),
    enabled: !!foodTruckId,
    refetchOnWindowFocus: false,
  });

  const activeDocuments = React.useMemo(() => responseDocuments(activeQuery.data), [activeQuery.data]);
  const archivedDocuments = React.useMemo(() => responseDocuments(archivedQuery.data), [archivedQuery.data]);

  React.useEffect(() => {
    const nextDrafts: Record<string, DateDraft> = {};
    activeDocuments.forEach((document) => {
      nextDrafts[document.document_id] = {
        issueDate: dateValue(document.issue_date),
        expirationDate: dateValue(document.expiration_date),
      };
    });
    setDateDrafts(nextDrafts);
  }, [activeDocuments]);

  const refresh = async () => {
    await Promise.all([activeQuery.refetch(), archivedQuery.refetch()]);
  };
  const updateDraft = (documentId: string, field: keyof DateDraft, value: string) => {
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
      expiration_date: document.document_type === "HEALTH_PERMIT" ? null : draft.expirationDate || null,
    };
  };
  const startEditing = (document: ComplianceDocument) => {
    setDateDrafts((current) => ({
      ...current,
      [document.document_id]: {
        issueDate: dateValue(document.issue_date),
        expirationDate: dateValue(document.expiration_date),
      },
    }));
    setReplacementFiles((current) => ({ ...current, [document.document_id]: null }));
    setEditingId(document.document_id);
  };
  const cancelEditing = (document: ComplianceDocument) => {
    setDateDrafts((current) => ({
      ...current,
      [document.document_id]: {
        issueDate: dateValue(document.issue_date),
        expirationDate: dateValue(document.expiration_date),
      },
    }));
    setReplacementFiles((current) => ({ ...current, [document.document_id]: null }));
    setEditingId(null);
  };

  const saveDates = async (document: ComplianceDocument) => {
    setWorkingId(document.document_id);
    try {
      await vendorComplianceApiService.updateDocumentDates(document.document_id, datePayload(document));
      toast.success("Compliance dates updated");
      await refresh();
      setEditingId(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update compliance dates");
    } finally {
      setWorkingId(null);
    }
  };
  const reviewDocument = async (document: ComplianceDocument, reviewStatus: "verified" | "rejected") => {
    if (reviewStatus === "rejected" && !window.confirm("Reject this document and require the vendor to upload a replacement? A previously verified document will be retained in Archived Documents.")) return;
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
        sanitation_grade: document.document_type === "HEALTH_PERMIT" ? sanitationGrade(document) : null,
        review_status: "pending_review",
      });
      toast.success("Replacement uploaded; any prior verified version was archived");
      setReplacementFiles((current) => ({ ...current, [document.document_id]: null }));
      await refresh();
      setEditingId(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to replace document");
    } finally {
      setWorkingId(null);
    }
  };
  const archiveDocument = async (document: ComplianceDocument) => {
    if (!window.confirm("Archive this document? Archived documents remain available for audit but cannot be changed.")) return;
    setWorkingId(document.document_id);
    try {
      await vendorComplianceApiService.archiveDocument(document.document_id, { reason: "Archived by RTC administrator" });
      toast.success("Document archived");
      if (editingId === document.document_id) setEditingId(null);
      await refresh();
      setArchivedExpanded(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to archive document");
    } finally {
      setWorkingId(null);
    }
  };
  const openDocument = (document: ComplianceDocument) => {
    const documentUrl = document.access_url || document.file_url;
    if (documentUrl) window.open(documentUrl, "_blank", "noopener,noreferrer");
  };
  const dateSummary = (document: ComplianceDocument) => {
    const isSanitation = document.document_type === "HEALTH_PERMIT";
    const parts = [`${isSanitation ? "Inspection" : "Issued"}: ${dateValue(document.issue_date) || "Not provided"}`];
    if (expirationDocumentTypes.has(document.document_type)) {
      parts.push(`Expires: ${dateValue(document.expiration_date) || "Not provided"}`);
    }
    return parts.join(" · ");
  };

  const renderActiveDocument = (document: ComplianceDocument) => {
    const isSanitation = document.document_type === "HEALTH_PERMIT";
    const hasExpiration = expirationDocumentTypes.has(document.document_type);
    const draft = dateDrafts[document.document_id] || {
      issueDate: dateValue(document.issue_date),
      expirationDate: dateValue(document.expiration_date),
    };
    const isWorking = workingId === document.document_id;
    const isEditing = editingId === document.document_id;
    const detectedIssueDate = ocrIssueDate(document);
    const detectedExpirationDate = ocrExpirationDate(document);
    const hasDetectedDates = !!detectedIssueDate || !!detectedExpirationDate;
    return (
      <div key={document.document_id} className="border-t first:border-t-0">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{documentLabels[document.document_type] || document.title || document.document_type}</span>
                <Badge className={statusClasses[document.review_status] || "bg-slate-100 text-slate-700"}>{formatStatus(document.review_status)}</Badge>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Version {document.version} · {dateSummary(document)} · OCR: {formatStatus(document.ocr_status)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Uploaded {document.created_at ? dayjs(document.created_at).format("MMM D, YYYY h:mm A") : "date unavailable"}
                {isSanitation && sanitationGrade(document) ? ` · Grade ${String(sanitationGrade(document)).toUpperCase()}` : ""}
                {document.ocr_error_message ? ` · ${document.ocr_error_message}` : ""}
              </div>
              {hasDetectedDates ? (
                <div className="mt-2 rounded-md border bg-muted/30 px-3 py-2 text-xs">
                  <div>
                    <span className="font-semibold">Vendor entered:</span>{" "}
                    {isSanitation ? "Inspection" : "Issue"} {dateValue(document.vendor_entered_issue_date) || "Not provided"}
                    {hasExpiration ? ` · Expiration ${dateValue(document.vendor_entered_expiration_date) || "Not provided"}` : ""}
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold">OCR detected:</span>{" "}
                    {isSanitation ? "Inspection" : "Issue"} {displayDetectedDate(detectedIssueDate)}
                    {hasExpiration ? ` · Expiration ${displayDetectedDate(detectedExpirationDate)}` : ""}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => openDocument(document)}><ExternalLink className="mr-1 h-4 w-4" /> Open</Button>
            {!isEditing ? <>
              <Button variant="outline" size="sm" disabled={isWorking || !!editingId} onClick={() => startEditing(document)}><Pencil className="mr-1 h-4 w-4" /> Edit</Button>
              <Button variant="outline" size="sm" disabled={isWorking || !!editingId} onClick={() => archiveDocument(document)}><Archive className="mr-1 h-4 w-4" /> Archive</Button>
              <Button size="sm" disabled={isWorking || !!editingId} onClick={() => reviewDocument(document, "verified")}><CheckCircle2 className="mr-1 h-4 w-4" /> Verify</Button>
              <Button variant="destructive" size="sm" disabled={isWorking || !!editingId} onClick={() => reviewDocument(document, "rejected")}><XCircle className="mr-1 h-4 w-4" /> Reject</Button>
            </> : null}
          </div>
        </div>
        {isEditing ? (
          <div className="border-t bg-muted/20 p-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium">{isSanitation ? "Inspection Date" : "Issue Date"}</span>
                <Input type="date" value={draft.issueDate} max={isSanitation ? dayjs().format("YYYY-MM-DD") : undefined} onChange={(event) => updateDraft(document.document_id, "issueDate", event.target.value)} />
              </label>
              {hasExpiration ? (
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Expiration Date</span>
                  <Input type="date" value={draft.expirationDate} onChange={(event) => updateDraft(document.document_id, "expirationDate", event.target.value)} />
                </label>
              ) : <div />}
              <label className="space-y-1 text-sm">
                <span className="font-medium">Replacement file (optional)</span>
                <Input type="file" accept="image/*,application/pdf" onChange={(event) => setReplacementFiles((current) => ({ ...current, [document.document_id]: event.target.files?.[0] || null }))} />
              </label>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">A replacement creates a new active version. If this version was verified, it moves into Archived Documents permanently.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" disabled={isWorking} onClick={() => cancelEditing(document)}>Cancel</Button>
              <Button disabled={isWorking} onClick={() => replacementFiles[document.document_id] ? replaceDocument(document) : saveDates(document)}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderArchivedDocument = (document: ComplianceDocument) => (
    <div key={document.document_id} className="flex flex-col gap-3 border-t p-4 first:border-t-0 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Archive className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{documentLabels[document.document_type] || document.title || document.document_type}</span>
            <Badge className={statusClasses.archived}>Archived</Badge>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">Version {document.version} · {dateSummary(document)} · OCR: {formatStatus(document.ocr_status)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Archived {document.archived_at ? dayjs(document.archived_at).format("MMM D, YYYY h:mm A") : "date unavailable"}
            {document.archived_reason ? ` · ${document.archived_reason}` : ""}
          </div>
        </div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0" onClick={() => openDocument(document)}><ExternalLink className="mr-1 h-4 w-4" /> Open</Button>
    </div>
  );

  if (activeQuery.isLoading || archivedQuery.isLoading) {
    return <div className="rounded-lg border p-6 text-sm text-muted-foreground">Loading compliance documents…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Compliance Documents</h2>
          <p className="text-sm text-muted-foreground">Active records can be corrected or replaced. Archived records are retained read-only for auditing.</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={activeQuery.isFetching || archivedQuery.isFetching}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        <button type="button" className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30" onClick={() => setActiveExpanded((value) => !value)}>
          <div><div className="font-semibold">Active Documents ({activeDocuments.length})</div><div className="text-xs text-muted-foreground">Editable, replaceable, and available for review.</div></div>
          {activeExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
        {activeExpanded ? (activeDocuments.length ? <div className="border-t">{activeDocuments.map(renderActiveDocument)}</div> : <div className="border-t p-6 text-center text-sm text-muted-foreground">No active compliance documents.</div>) : null}
      </section>

      <section className="overflow-hidden rounded-lg border bg-card">
        <button type="button" className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30" onClick={() => setArchivedExpanded((value) => !value)}>
          <div><div className="font-semibold">Archived Documents ({archivedDocuments.length})</div><div className="text-xs text-muted-foreground">Permanent read-only history retained for audit.</div></div>
          {archivedExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
        {archivedExpanded ? (archivedDocuments.length ? <div className="border-t">{archivedDocuments.map(renderArchivedDocument)}</div> : <div className="border-t p-6 text-center text-sm text-muted-foreground">No archived compliance documents.</div>) : null}
      </section>
    </div>
  );
}
