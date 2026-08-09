"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AdminEventVendorProfile,
  EventVendorReviewStatus,
  marketplaceApiService,
} from "@/services/marketplace-api-service";

const CATEGORY_LABELS: Record<string, string> = {
  ARTISANS_CRAFTERS: "Artisans and Crafters",
  APPAREL_ACCESSORIES: "Apparel and Accessory Vendors",
  COMMERCIAL_RETAIL: "Commercial and Retail Vendors",
  LOCAL_MAKERS_SPECIALTY: "Local Makers and Specialty Goods",
};

export default function MarketplaceVendorsPage() {
  const [status, setStatus] = useState<EventVendorReviewStatus | "">("PENDING_REVIEW");
  const [selected, setSelected] = useState<AdminEventVendorProfile | null>(null);
  const [reason, setReason] = useState("");
  const listQuery = useQuery({
    queryKey: ["marketplace-vendors", status],
    queryFn: () => marketplaceApiService.listEventVendorProfiles(status),
  });
  const detailQuery = useQuery({
    queryKey: ["marketplace-vendor", selected?.profile_id],
    queryFn: () => marketplaceApiService.getEventVendorProfile(selected!.profile_id),
    enabled: !!selected,
  });
  const profiles = listQuery.data?.data?.data?.profileList || [];
  const detail = detailQuery.data?.data?.data;

  const review = async (reviewStatus: "APPROVED" | "REJECTED") => {
    if (!selected) return;
    if (reviewStatus === "REJECTED" && !reason.trim()) {
      toast.error("Enter a rejection reason.");
      return;
    }
    await marketplaceApiService.reviewEventVendorProfile(selected.profile_id, reviewStatus, reason.trim());
    toast.success(`Marketplace Vendor ${reviewStatus.toLowerCase()}.`);
    setSelected(null);
    setReason("");
    await listQuery.refetch();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Marketplace Vendors</h1>
        <select className="rounded border p-2" value={status} onChange={(event) => setStatus(event.target.value as EventVendorReviewStatus | "")}>
          <option value="">All</option>
          <option value="PENDING_REVIEW">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {profiles.map((profile) => (
            <button key={profile.profile_id} className="w-full rounded-lg border bg-white p-4 text-left" onClick={() => setSelected(profile)}>
              <div className="font-semibold">{profile.business_name}</div>
              <div>{profile.vendor_user_id?.firstName} {profile.vendor_user_id?.lastName} · {profile.vendor_user_id?.email}</div>
              <div className="text-sm text-slate-600">{profile.vendor_types.join(", ")} · {profile.review_status === "PENDING_REVIEW" && Number(profile.submission_count || 0) > 1 ? "RESUBMITTED" : profile.review_status}</div>
              <div className="text-sm text-slate-500">Submitted: {profile.submitted_at ? new Date(profile.submitted_at).toLocaleString() : "Not submitted"}</div>
            </button>
          ))}
          {!profiles.length ? <p>No Marketplace Vendor profiles match this status.</p> : null}
        </div>
        {selected && detail?.eventVendorProfile ? (
          <div className="rounded-lg border bg-white p-5">
            <h2 className="text-2xl font-semibold">{detail.eventVendorProfile.business_name}</h2>
            <p className="mt-2">{detail.eventVendorProfile.business_description}</p>
            <p className="mt-2"><strong>Types:</strong> {detail.eventVendorProfile.vendor_types.join(", ")}</p>
            <p><strong>Categories:</strong> {(detail.eventVendorProfile.merchandise_categories || []).map((item) => CATEGORY_LABELS[item] || item).join(", ") || "None"}</p>
            <p><strong>Contact:</strong> {detail.eventVendorProfile.vendor_user_id.email}</p>
            {detail.eventVendorProfile.logo_url ? <img className="mt-3 h-32 w-32 rounded object-contain" src={detail.eventVendorProfile.logo_url} alt="Business logo" /> : null}
            <div className="mt-3 space-y-1">{(detail.eventVendorProfile.social_links || []).map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="block text-blue-700 underline">{link}</a>)}</div>
            <div className="mt-4 grid grid-cols-2 gap-2">{(detail.photoList || []).map((photo) => <div key={photo.photo_id}><img src={photo.file_url} alt={photo.original_name || "Portfolio"} className="h-32 w-full rounded object-cover" /><div className="text-xs">{CATEGORY_LABELS[photo.category || ""] || photo.category}</div></div>)}</div>
            {detail.eventVendorProfile.review_status === "PENDING_REVIEW" ? <div className="mt-5 space-y-3"><textarea className="w-full rounded border p-2" placeholder="Rejection reason" value={reason} onChange={(event) => setReason(event.target.value)} /><div className="flex gap-2"><Button onClick={() => review("APPROVED")}>Approve</Button><Button variant="destructive" onClick={() => review("REJECTED")}>Reject</Button></div></div> : null}
            {detail.eventVendorProfile.rejection_reason ? <p className="mt-3 text-red-700">Rejection reason: {detail.eventVendorProfile.rejection_reason}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
