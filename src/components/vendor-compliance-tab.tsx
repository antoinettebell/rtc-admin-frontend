"use client";

import * as React from "react";
import dayjs from "dayjs";
import { ChevronDown, ChevronRight, ExternalLink, FileText, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ComplianceDocument,
  ProviderVerification,
  vendorComplianceApiService,
} from "@/services/vendor-compliance-api-service";

const labels: Record<string, string> = {
  HEALTH_PERMIT: "Sanitation Grade",
  BUSINESS_LICENSE: "Permit/Business License",
  COI: "Certificate of Insurance",
  LIQUOR_LICENSE: "Liquor License",
  EIN: "EIN",
  SSN_CARD: "Driver License",
  W9: "W-9",
};

const responseDocuments = (response: any): ComplianceDocument[] =>
  response?.data?.data?.complianceDocumentList || response?.data?.data?.records || [];

const text = (value?: string | null) =>
  String(value || "Not started")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const badgeClass = (value?: string | null) => {
  const status = String(value || "").toLowerCase();
  if (["verified", "passed", "completed"].includes(status)) return "bg-green-100 text-green-800";
  if (["failed", "rejected"].includes(status)) return "bg-red-100 text-red-800";
  if (["pending", "queued", "processing", "pending_review"].includes(status)) return "bg-yellow-100 text-yellow-900";
  return "bg-slate-100 text-slate-700";
};

const grade = (document: ComplianceDocument) =>
  document.extracted_fields?.sanitation_grade || document.extracted_fields?.manual_sanitation_grade || null;

// A legal payee or a truck unit has one current record for each document type.
// Historical replacements may remain for audit, but must not appear as duplicates.
const currentDocuments = (documents: ComplianceDocument[]) => {
  const newestFirst = [...documents].sort(
    (left, right) => new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime(),
  );
  const seen = new Set<string>();

  return newestFirst.filter((document) => {
    const scope = document.document_scope === "TRUCK_UNIT" ? "TRUCK_UNIT" : "PAYEE";
    const truckUnitId = scope === "TRUCK_UNIT" ? document.truck_unit_id || document.food_truck_id || "selected" : "";
    const key = `${scope}:${truckUnitId}:${document.document_type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function VendorComplianceTab({ foodTruckId }: { foodTruckId: string }) {
  const [payeeOpen, setPayeeOpen] = React.useState(true);
  const [truckOpen, setTruckOpen] = React.useState(true);
  const activeQuery = useQuery({
    queryKey: ["vendor-compliance-documents", foodTruckId, "active"],
    queryFn: () => vendorComplianceApiService.listDocuments({ page: 1, limit: 100, food_truck_id: foodTruckId }),
    enabled: !!foodTruckId,
    refetchOnWindowFocus: false,
  });
  const summaryQuery = useQuery({
    queryKey: ["vendor-compliance-summary", foodTruckId],
    queryFn: () => vendorComplianceApiService.getFoodTruckSummary(foodTruckId),
    enabled: !!foodTruckId,
    refetchOnWindowFocus: false,
  });

  const current = currentDocuments(responseDocuments(activeQuery.data));
  const legalPayeeDocuments = current.filter((document) => document.document_scope !== "TRUCK_UNIT");
  const truckDocuments = current.filter((document) => document.document_scope === "TRUCK_UNIT");
  const summary = summaryQuery.data?.data?.data?.compliance;
  const verification = summary?.external_verification;
  const refresh = () => Promise.all([activeQuery.refetch(), summaryQuery.refetch()]);

  const renderDocument = (document: ComplianceDocument) => {
    const url = document.access_url || document.file_url;
    const operational = document.document_scope === "TRUCK_UNIT";

    return (
      <div key={document.document_id} className="flex flex-col gap-3 border-t p-4 first:border-t-0 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">{labels[document.document_type] || document.title || document.document_type}</span>
            <Badge className={operational ? "bg-slate-100 text-slate-700" : badgeClass(document.review_status)}>
              {operational ? "Operational record" : text(document.review_status)}
            </Badge>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {operational ? "Recorded for this food truck only; it does not require compliance review." : `OCR: ${text(document.ocr_status)} · `}
            Uploaded {document.created_at ? dayjs(document.created_at).format("MMM D, YYYY h:mm A") : "date unavailable"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Issued: {document.issue_date ? dayjs(document.issue_date).format("MMM D, YYYY") : "Not provided"}
            {document.expiration_date ? ` · Expires: ${dayjs(document.expiration_date).format("MMM D, YYYY")}` : ""}
            {grade(document) ? ` · Grade ${String(grade(document)).toUpperCase()}` : ""}
            {!operational && document.ocr_error_message ? ` · ${document.ocr_error_message}` : ""}
          </div>
        </div>
        {url ? <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank", "noopener,noreferrer")}><ExternalLink className="mr-1 h-4 w-4" /> Open</Button> : null}
      </div>
    );
  };

  if (activeQuery.isLoading) return <div className="rounded-lg border p-6 text-sm text-muted-foreground">Loading compliance…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Compliance</h2>
          <p className="text-sm text-muted-foreground">Read-only automated compliance record. Staff cannot verify, reject, edit, or replace compliance evidence.</p>
        </div>
        <Button variant="outline" onClick={refresh}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="font-semibold">Compliance score</div><div className="text-sm text-muted-foreground">Calculated from the vendor Compliance page.</div></div>
          <Badge className={Number(summary?.score) === 100 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-900"}>{summary?.score ?? 0}%</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{(summary?.core_components || []).map((item: any) => <Badge key={item.type} className={badgeClass(item.verified ? "verified" : "pending")}>{item.label}: {item.verified ? "Verified" : "Outstanding"}</Badge>)}</div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <div className="font-semibold">External verification</div>
        <div className="mt-2 flex flex-wrap gap-2">{(verification?.checks || []).length ? verification.checks.map((check: ProviderVerification) => <Badge key={check.verification_id} className={badgeClass(check.status)}>{check.provider} {check.check_type}: {text(check.status)}</Badge>) : <span className="text-sm text-muted-foreground">Not started</span>}</div>
      </section>

      <section className="overflow-hidden rounded-lg border bg-card">
        <button type="button" className="flex w-full items-center justify-between p-4 text-left font-semibold" onClick={() => setPayeeOpen((value) => !value)}>
          Current legal-payee documents {payeeOpen ? <ChevronDown /> : <ChevronRight />}
        </button>
        {payeeOpen ? legalPayeeDocuments.length ? legalPayeeDocuments.map(renderDocument) : <p className="border-t p-4 text-sm text-muted-foreground">No current legal-payee documents.</p> : null}
      </section>

      <section className="overflow-hidden rounded-lg border bg-card">
        <button type="button" className="flex w-full items-center justify-between p-4 text-left font-semibold" onClick={() => setTruckOpen((value) => !value)}>
          Current selected-food-truck records {truckOpen ? <ChevronDown /> : <ChevronRight />}
        </button>
        {truckOpen ? truckDocuments.length ? truckDocuments.map(renderDocument) : <p className="border-t p-4 text-sm text-muted-foreground">No current operational records.</p> : null}
      </section>
    </div>
  );
}
