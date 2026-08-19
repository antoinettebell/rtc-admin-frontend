"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, ExternalLink, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  MarketplaceSubmissionDetail,
  MarketplaceSubmissionType,
  marketplaceApiService,
} from "@/services/marketplace-api-service";

const booleanFields = new Set([
  "insurance_confirmed",
  "permits_confirmed",
  "liquor_license_confirmed",
  "electricity_required",
]);

const numberFields = new Set([
  "price_per_guest",
  "average_price_per_meal",
  "full_bid_amount",
  "regular_guest_amount",
  "vip_catering_amount",
  "average_price",
]);

const arrayFields = new Set(["vendor_types", "offering_bullets"]);

const replaceableAttachmentTypes = new Set([
  "BID_MENU_PDF",
  "BID_IMAGE",
  "APPLICATION_MENU_PDF",
  "APPLICATION_IMAGE",
  "PERMIT_LICENSE",
  "REQUIREMENT_DOCUMENT",
]);

const titleForType = (type: MarketplaceSubmissionType) => ({
  FOOD_BID: "Food Vendor Bid",
  FOOD_APPLICATION: "Food Vendor Application",
  MARKETPLACE_APPLICATION: "Marketplace Vendor Application",
}[type]);

const unwrap = (value: any) => value?.data?.data || value?.data || value;

export default function MarketplaceSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = decodeURIComponent(String(params.eventId || ""));
  const submissionType = decodeURIComponent(
    String(params.submissionType || ""),
  ) as MarketplaceSubmissionType;
  const submissionId = decodeURIComponent(String(params.submissionId || ""));
  const [draft, setDraft] = React.useState<Record<string, any>>({});
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [replacementFiles, setReplacementFiles] = React.useState<
    Record<string, File | null>
  >({});

  const query = useQuery({
    queryKey: ["marketplace-repository-submission", eventId, submissionType, submissionId],
    queryFn: () =>
      marketplaceApiService.getRepositorySubmission(
        eventId,
        submissionType,
        submissionId,
      ),
    enabled: Boolean(eventId && submissionType && submissionId),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const detail = unwrap(query.data) as MarketplaceSubmissionDetail | undefined;

  React.useEffect(() => {
    if (!detail) return;
    const savedDraft = detail.admin_draft?.payload || {};
    const nextDraft: Record<string, any> = {};
    detail.editable_fields.forEach((field) => {
      const value = Object.prototype.hasOwnProperty.call(savedDraft, field)
        ? savedDraft[field]
        : detail.submission?.[field];
      nextDraft[field] = arrayFields.has(field)
        ? (Array.isArray(value) ? value : []).join("\n")
        : value ?? (booleanFields.has(field) ? false : "");
    });
    setDraft(nextDraft);
    setReason(detail.admin_draft?.reason || "");
  }, [detail]);

  const save = async (saveMode: "DRAFT" | "PUBLISH") => {
    if (!reason.trim()) {
      toast.error("Enter an admin change reason.");
      return;
    }
    const payload = Object.fromEntries(
      Object.entries(draft).map(([field, value]) => {
        if (arrayFields.has(field)) {
          return [field, String(value || "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean)];
        }
        if (numberFields.has(field)) {
          return [field, value === "" ? null : Number(value)];
        }
        return [field, value];
      }),
    );
    setBusy(true);
    try {
      await marketplaceApiService.updateRepositorySubmission(
        eventId,
        submissionType,
        submissionId,
        { ...payload, admin_reason: reason.trim(), save_mode: saveMode },
      );
      toast.success(saveMode === "DRAFT" ? "Draft saved." : "Submission published.");
      if (saveMode === "PUBLISH") setReason("");
      await query.refetch();
    } catch (error: any) {
      const validationErrors = error?.response?.data?.validation_errors || error?.response?.data?.data?.validation_errors;
      const message = Array.isArray(validationErrors) && validationErrors.length
        ? validationErrors.map((item: any) => `${item.field}: ${item.message}`).join(" · ")
        : error?.response?.data?.message || error?.message || "Unable to update submission.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (action: "WITHDRAW" | "ARCHIVE" | "DELETE" | "REVOKE") => {
    if (!reason.trim()) {
      toast.error("Enter an admin action reason.");
      return;
    }
    const prompt = action === "REVOKE"
      ? "Revoke this award? This releases capacity and prevents final payment. Attendance fees are not refunded."
      : `${action === "DELETE" ? "Delete" : action.toLowerCase()} this submission?`;
    if (!window.confirm(prompt)) return;
    setBusy(true);
    try {
      await marketplaceApiService.actionRepositorySubmission(
        eventId,
        submissionType,
        submissionId,
        action,
        reason.trim(),
      );
      toast.success(`Submission ${action.toLowerCase()} action completed.`);
      if (action === "WITHDRAW" || action === "REVOKE") {
        setReason("");
        await query.refetch();
      } else {
        router.push("/marketplace-repository");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Unable to manage submission.");
    } finally {
      setBusy(false);
    }
  };

  const openAttachment = async (attachmentId: string, download = false) => {
    try {
      const result = await marketplaceApiService.accessFile(attachmentId, download);
      const file = unwrap(result);
      if (!file?.file_url) throw new Error("File link unavailable");
      window.open(file.file_url, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Unable to open file.");
    }
  };

  const replaceAttachment = async (attachmentId: string) => {
    const file = replacementFiles[attachmentId];
    if (!file) {
      toast.error("Choose a replacement file.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Enter an admin change reason before replacing a file.");
      return;
    }
    setBusy(true);
    try {
      await marketplaceApiService.replaceRepositorySubmissionAttachment(
        eventId,
        submissionType,
        submissionId,
        attachmentId,
        file,
        reason.trim(),
      );
      toast.success("Submission file replaced. The prior file remains archived in the audit history.");
      setReplacementFiles((current) => ({ ...current, [attachmentId]: null }));
      await query.refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Unable to replace file.");
    } finally {
      setBusy(false);
    }
  };

  if (query.isLoading) return <div className="p-6">Loading submission…</div>;
  if (query.isError || !detail) {
    return (
      <div className="space-y-4 p-6">
        <p>Unable to load this marketplace submission.</p>
        <Button asChild variant="outline"><Link href="/marketplace-repository">Back to Marketplace Repository</Link></Button>
      </div>
    );
  }

  const coordinator = detail.marketplaceEvent?.customer_user_id as any;
  const vendor = detail.submission?.vendor_user_id as any;
  const administrativeState = detail.submission?.deleted_at
    ? "deleted"
    : detail.submission?.archived_at
      ? "archived"
      : null;
  const isReadOnly = Boolean(administrativeState);
  const draftErrors = detail.admin_draft?.validation_errors || [];

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" className="mb-2 px-0">
            <Link href="/marketplace-repository"><ArrowLeft className="mr-2 h-4 w-4" />Marketplace Repository</Link>
          </Button>
          <h1 className="text-2xl font-semibold">{titleForType(detail.submission_type)}</h1>
          <p className="text-sm text-muted-foreground">Canonical record {detail.submission_id}</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-sm font-medium">{detail.status}</span>
      </div>

      <section className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2">
        <div><div className="text-xs text-muted-foreground">Event</div><div className="font-medium">{detail.marketplaceEvent?.event_name || eventId}</div></div>
        <div><div className="text-xs text-muted-foreground">Coordinator</div><div className="font-medium">{[coordinator?.firstName, coordinator?.lastName].filter(Boolean).join(" ") || coordinator?.email || "-"}</div></div>
        <div><div className="text-xs text-muted-foreground">Vendor</div><div className="font-medium">{detail.submission?.business_name || detail.submission?.food_truck_id?.name || [vendor?.firstName, vendor?.lastName].filter(Boolean).join(" ") || vendor?.email || "-"}</div></div>
        <div><div className="text-xs text-muted-foreground">Type</div><div className="font-medium">{titleForType(detail.submission_type)}</div></div>
      </section>

      <section className="space-y-4 rounded-lg border bg-white p-4">
        <div><h2 className="text-lg font-semibold">Submission details</h2><p className="text-sm text-muted-foreground">Changes write to the vendor’s canonical submission record.</p></div>
        {isReadOnly ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            This submission is {administrativeState} and is retained as read-only history.
          </p>
        ) : null}
        {draftErrors.length ? (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
            <div className="font-medium">This draft was retained. Correct the following before publishing:</div>
            <ul className="mt-1 list-disc pl-5">
              {draftErrors.map((item, index) => <li key={`${item.field}-${index}`}>{item.field}: {item.message}</li>)}
            </ul>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {detail.editable_fields.map((field) => {
            const locked = detail.locked_fields?.includes(field);
            return (
            <label key={field} className={arrayFields.has(field) || field.includes("description") || field.includes("notes") ? "md:col-span-2" : ""}>
              <span className="mb-1 block text-sm font-medium">{field.replace(/_/g, " ")}{locked ? " (protected after award)" : ""}</span>
              {booleanFields.has(field) ? (
                <input type="checkbox" checked={Boolean(draft[field])} disabled={isReadOnly || locked} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.checked }))} className="h-5 w-5" />
              ) : arrayFields.has(field) || field.includes("description") || field.includes("notes") ? (
                <textarea value={draft[field] ?? ""} disabled={isReadOnly || locked} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} rows={4} className="w-full rounded-md border px-3 py-2" />
              ) : (
                <input type={numberFields.has(field) ? "number" : "text"} step={numberFields.has(field) ? "0.01" : undefined} value={draft[field] ?? ""} disabled={isReadOnly || locked} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} className="w-full rounded-md border px-3 py-2" />
              )}
            </label>
          )})}
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Admin reason *</span>
          <textarea value={reason} disabled={isReadOnly} onChange={(event) => setReason(event.target.value)} rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Required for the audit record" />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => save("DRAFT")} disabled={busy || isReadOnly}><Save className="mr-2 h-4 w-4" />Save Draft</Button>
          <Button onClick={() => save("PUBLISH")} disabled={busy || isReadOnly}><Save className="mr-2 h-4 w-4" />Publish Changes</Button>
          {detail.revoke_allowed ? <Button variant="destructive" onClick={() => runAction("REVOKE")} disabled={busy || isReadOnly}>Revoke Award</Button> : null}
          <Button variant="outline" onClick={() => runAction("WITHDRAW")} disabled={busy || isReadOnly || detail.status === "WITHDRAWN"}>Withdraw</Button>
          <Button variant="outline" onClick={() => runAction("ARCHIVE")} disabled={busy || isReadOnly}>Archive</Button>
          <Button variant="destructive" onClick={() => runAction("DELETE")} disabled={busy || isReadOnly}>Delete</Button>
        </div>
        {detail.revoke_block_reason ? <p className="text-sm text-amber-800">Revoke unavailable: {detail.revoke_block_reason}</p> : null}
        <p className="text-xs text-muted-foreground">Award pricing is protected. Admin revocation releases capacity and prevents final payment; it does not refund an attendance fee.</p>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div><h2 className="text-lg font-semibold">Submission files</h2><p className="text-sm text-muted-foreground">Files stay attached to this exact bid or application.</p></div>
        {detail.attachments.length ? detail.attachments.map((attachment) => {
          const replaceable = replaceableAttachmentTypes.has(String(attachment.attachment_type || ""));
          return (
          <div key={attachment.attachment_id} className="space-y-3 rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="font-medium">{attachment.requirement_label || attachment.original_name || attachment.attachment_type || "Attachment"}</div><div className="text-xs text-muted-foreground">{attachment.status || "ACTIVE"}</div></div>
              <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openAttachment(attachment.attachment_id)}><ExternalLink className="mr-2 h-4 w-4" />View</Button>
              <Button variant="outline" size="sm" onClick={() => openAttachment(attachment.attachment_id, true)}><Download className="mr-2 h-4 w-4" />Download</Button>
              </div>
            </div>
            {replaceable && !isReadOnly && attachment.status !== "DELETED" ? (
              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.heic,.heif,application/pdf,image/*"
                  disabled={busy}
                  onChange={(event) => setReplacementFiles((current) => ({
                    ...current,
                    [attachment.attachment_id]: event.target.files?.[0] || null,
                  }))}
                  className="max-w-full text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy || !replacementFiles[attachment.attachment_id]}
                  onClick={() => replaceAttachment(attachment.attachment_id)}
                >
                  <Upload className="mr-2 h-4 w-4" />Replace File
                </Button>
              </div>
            ) : attachment.attachment_type === "AGREEMENT_DOCUMENT" ? (
              <p className="border-t pt-3 text-xs text-muted-foreground">Signed agreements are immutable. Start a new signing workflow if a new agreement is required.</p>
            ) : null}
          </div>
        )}) : <p className="text-sm text-muted-foreground">No files are attached to this submission.</p>}
      </section>
    </div>
  );
}
