"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye, FileText, Loader2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/hooks/use-user";
import {
  approveCampaignState, campaignActionsDisabled, campaignTypeLabel, emptyCampaignMessage,
  preserveUsableRendition, reasonLabel, replaceCampaign,
} from "@/helpers/marketing-campaign-approval";
import {
  marketingCampaignApiService, MarketingCampaign, MarketingCampaignDetail,
} from "@/services/marketing-campaign-api-service";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

function CampaignPreview({ campaign, onClose }: { campaign: MarketingCampaign | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(campaign)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{campaign?.businessName || "Campaign preview"}</DialogTitle>
          <DialogDescription>Current approved-quality campaign rendition.</DialogDescription>
        </DialogHeader>
        {campaign?.videoUrl ? (
          <video className="max-h-[70vh] w-full rounded-md bg-black" src={campaign.videoUrl} controls preload="metadata" />
        ) : <p className="rounded-md border p-6 text-sm text-muted-foreground">No preview is available.</p>}
      </DialogContent>
    </Dialog>
  );
}

function CampaignDetails({ detail, loading, onClose }: {
  detail: MarketingCampaignDetail | null; loading: boolean; onClose: () => void;
}) {
  return (
    <Dialog open={loading || Boolean(detail)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Details</DialogTitle>
          <DialogDescription>Current campaign information and approved marketing inputs.</DialogDescription>
        </DialogHeader>
        {loading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : detail ? (
          <div className="space-y-5 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["Business Name", detail.businessName], ["Campaign Type", campaignTypeLabel(detail.campaignType)],
                ["Reason", reasonLabel(detail.reason)], ["Generated", formatDate(detail.generatedAt)],
                ["Last Updated", formatDate(detail.updatedAt)], ["Regeneration Count", detail.regenerationCount],
                ["Generation Status", detail.generationStatus], ["Approval Status", detail.approvalStatus],
                ["Campaign Month", detail.campaignMonth || "—"], ["Campaign Version", detail.campaignVersion],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-md border bg-slate-50 p-3">
                  <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
            {detail.videoUrl ? <video className="max-h-80 w-full rounded-md bg-black" src={detail.videoUrl} controls /> : null}
            {detail.selectedFoodImages?.length ? (
              <div><h3 className="mb-2 font-semibold">Selected food/menu images</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {detail.selectedFoodImages.map((image, index) => (
                    <figure key={`${image.url}-${index}`} className="overflow-hidden rounded-md border">
                      {/* Approved provider-hosted campaign assets are intentionally displayed without copying them. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={image.name || `Selected food ${index + 1}`} className="aspect-square w-full object-cover" />
                      <figcaption className="p-2 text-xs">{image.name || "Menu image"}{image.category ? ` · ${image.category}` : ""}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ) : null}
            {detail.scheduleText ? <div><h3 className="mb-2 font-semibold">Schedule</h3><pre className="whitespace-pre-wrap rounded-md border bg-slate-50 p-3 font-sans">{detail.scheduleText}</pre></div> : null}
            {detail.supportedServices?.length ? <div><h3 className="mb-2 font-semibold">Supported services</h3><p>{detail.supportedServices.join(" · ")}</p></div> : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function MarketingCampaignApprovalPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [pending, setPending] = useState<MarketingCampaign[]>([]);
  const [approved, setApproved] = useState<MarketingCampaign[]>([]);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [approvedOpen, setApprovedOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyCampaignId, setBusyCampaignId] = useState<string | null>(null);
  const [preview, setPreview] = useState<MarketingCampaign | null>(null);
  const [detail, setDetail] = useState<MarketingCampaignDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [approveTarget, setApproveTarget] = useState<MarketingCampaign | null>(null);
  const [regenerateTarget, setRegenerateTarget] = useState<MarketingCampaign | null>(null);
  const [regenerationReason, setRegenerationReason] = useState("");

  const load = useCallback(async () => {
    if (user?.userType !== "SUPER_ADMIN") { setLoading(false); return; }
    setLoading(true);
    try {
      const [pendingResponse, approvedResponse] = await Promise.all([
        marketingCampaignApiService.listPending(), marketingCampaignApiService.listApproved(),
      ]);
      setPending(pendingResponse.data.data.campaigns);
      setApproved(approvedResponse.data.data.campaigns);
    } catch {
      toast({ title: "Campaign load failed", description: "The campaign queues could not be loaded.", variant: "destructive" });
    } finally { setLoading(false); }
  }, [toast, user?.userType]);

  useEffect(() => { void load(); }, [load]);

  const processingIds = useMemo(() => pending
    .filter((campaign) => campaign.generationStatus === "PROCESSING")
    .map((campaign) => campaign.campaignId), [pending]);
  const processingIdsKey = processingIds.join("|");

  useEffect(() => {
    const activeIds = processingIdsKey ? processingIdsKey.split("|") : [];
    if (!activeIds.length) return;
    const poll = window.setInterval(async () => {
      for (const campaignId of activeIds) {
        try {
          const response = await marketingCampaignApiService.getDetails(campaignId);
          const updated = response.data.data.campaign;
          setPending((rows) => rows.map((row) => row.campaignId === campaignId
            ? preserveUsableRendition(row, updated) : row));
          if (updated.generationStatus === "COMPLETED") {
            toast({ title: "Regeneration completed", description: `${updated.businessName} is ready for review.` });
          } else if (updated.generationStatus === "FAILED") {
            toast({ title: "Regeneration failed", description: "The prior usable video remains available.", variant: "destructive" });
          }
        } catch { /* Keep the current usable rendition and retry status polling. */ }
      }
    }, 4000);
    return () => window.clearInterval(poll);
  }, [processingIdsKey, toast]);

  const approveSelected = async () => {
    if (!approveTarget || campaignActionsDisabled(approveTarget, busyCampaignId)) return;
    setBusyCampaignId(approveTarget.campaignId);
    try {
      const response = await marketingCampaignApiService.approve(approveTarget.campaignId);
      const next = approveCampaignState(pending, approved, response.data.data.campaign);
      setPending(next.pending); setApproved(next.approved); setApproveTarget(null);
      toast({ title: "Campaign approved", description: "The campaign moved to Archived / Approved." });
    } catch { toast({ title: "Approval failed", description: "The campaign remains in the review queue.", variant: "destructive" }); }
    finally { setBusyCampaignId(null); }
  };

  const regenerateSelected = async () => {
    if (!regenerateTarget || campaignActionsDisabled(regenerateTarget, busyCampaignId)) return;
    setBusyCampaignId(regenerateTarget.campaignId);
    try {
      const response = await marketingCampaignApiService.regenerate(regenerateTarget.campaignId, regenerationReason);
      const replacement = preserveUsableRendition(regenerateTarget, response.data.data.result.campaign);
      setPending((rows) => replaceCampaign(rows, replacement));
      setRegenerateTarget(null); setRegenerationReason("");
      toast({ title: "Regeneration started", description: "The existing video stays available until its replacement succeeds." });
    } catch { toast({ title: "Regeneration failed", description: "The current usable video was preserved.", variant: "destructive" }); }
    finally { setBusyCampaignId(null); }
  };

  const openDetails = async (campaignId: string) => {
    setDetail(null); setDetailLoading(true);
    try { setDetail((await marketingCampaignApiService.getDetails(campaignId)).data.data.campaign); }
    catch { toast({ title: "Details unavailable", description: "Campaign details could not be loaded.", variant: "destructive" }); }
    finally { setDetailLoading(false); }
  };

  if (user?.userType !== "SUPER_ADMIN") {
    return <div className="rounded-md border bg-white p-8"><h1 className="text-2xl font-semibold">Marketing Campaign Approval</h1><p className="mt-2 text-muted-foreground">Administrator access is required.</p></div>;
  }

  const renderTable = (campaigns: MarketingCampaign[], archived = false) => (
    campaigns.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">{emptyCampaignMessage(archived ? "approved" : "pending")}</div> :
    <Table><TableHeader><TableRow>
      <TableHead>Business</TableHead><TableHead>Campaign Type</TableHead><TableHead>Reason</TableHead>
      <TableHead>{archived ? "Approved" : "Generated"}</TableHead><TableHead>Status</TableHead>
      {!archived ? <TableHead>Regenerations</TableHead> : null}<TableHead className="text-right">Actions</TableHead>
    </TableRow></TableHeader><TableBody>{campaigns.map((campaign) => {
      const disabled = campaignActionsDisabled(campaign, busyCampaignId);
      return <TableRow key={campaign.campaignId}>
        <TableCell className="font-medium">{campaign.businessName}</TableCell>
        <TableCell>{campaignTypeLabel(campaign.campaignType)}</TableCell>
        <TableCell>{reasonLabel(campaign.reason)}</TableCell>
        <TableCell>{formatDate(archived ? campaign.approvedAt : campaign.generatedAt)}</TableCell>
        <TableCell><Badge variant={campaign.generationStatus === "FAILED" ? "destructive" : "secondary"}>{campaign.generationStatus === "PROCESSING" ? "Processing / Regenerating" : campaign.generationStatus}</Badge></TableCell>
        {!archived ? <TableCell>{campaign.regenerationCount}</TableCell> : null}
        <TableCell><div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setPreview(campaign)} disabled={!campaign.videoUrl}><Eye className="mr-1 h-4 w-4" /> Preview Video</Button>
          <Button size="sm" variant="outline" onClick={() => void openDetails(campaign.campaignId)}><FileText className="mr-1 h-4 w-4" /> View Details</Button>
          {!archived ? <>
            <Button size="sm" variant="outline" disabled={disabled} onClick={() => setRegenerateTarget(campaign)}><RefreshCw className="mr-1 h-4 w-4" /> Regenerate</Button>
            <Button size="sm" disabled={disabled || campaign.generationStatus !== "COMPLETED"} onClick={() => setApproveTarget(campaign)}>Archive / Approve</Button>
          </> : null}
        </div></TableCell>
      </TableRow>;
    })}</TableBody></Table>
  );

  return <div className="space-y-4">
    <div><h1 className="text-2xl font-semibold">Marketing Campaign Approval</h1><p className="text-sm text-muted-foreground">Review current campaign renditions, request a replacement, or archive approved keepers.</p></div>
    {loading ? <div className="flex justify-center rounded-md border bg-white p-12"><Loader2 className="h-7 w-7 animate-spin" /></div> : <>
      <Collapsible open={pendingOpen} onOpenChange={setPendingOpen} className="rounded-md border bg-white">
        <CollapsibleTrigger asChild><button className="flex w-full items-center justify-between p-4 text-left"><div><h2 className="text-lg font-semibold">Pending Campaigns ({pending.length})</h2><p className="text-sm text-muted-foreground">Completed campaigns awaiting admin review.</p></div><ChevronDown className={`h-5 w-5 transition-transform ${pendingOpen ? "rotate-180" : ""}`} /></button></CollapsibleTrigger>
        <CollapsibleContent className="border-t">{renderTable(pending)}</CollapsibleContent>
      </Collapsible>
      <Collapsible open={approvedOpen} onOpenChange={setApprovedOpen} className="rounded-md border bg-white">
        <CollapsibleTrigger asChild><button className="flex w-full items-center justify-between p-4 text-left"><div><h2 className="text-lg font-semibold">Archived / Approved ({approved.length})</h2><p className="text-sm text-muted-foreground">Approved keeper campaigns for reference.</p></div><ChevronDown className={`h-5 w-5 transition-transform ${approvedOpen ? "rotate-180" : ""}`} /></button></CollapsibleTrigger>
        <CollapsibleContent className="border-t">{renderTable(approved, true)}</CollapsibleContent>
      </Collapsible>
    </>}

    <CampaignPreview campaign={preview} onClose={() => setPreview(null)} />
    <CampaignDetails detail={detail} loading={detailLoading} onClose={() => { setDetail(null); setDetailLoading(false); }} />

    <AlertDialog open={Boolean(approveTarget)} onOpenChange={(open) => !open && setApproveTarget(null)}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Archive and approve this campaign?</AlertDialogTitle><AlertDialogDescription>I reviewed and approve this campaign. Remove it from my active queue.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void approveSelected()} disabled={Boolean(busyCampaignId)}>Archive / Approve</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={Boolean(regenerateTarget)} onOpenChange={(open) => !open && setRegenerateTarget(null)}>
      <DialogContent><DialogHeader><DialogTitle>Regenerate campaign</DialogTitle><DialogDescription>The replacement will use the same campaign row. The current video remains available until the replacement succeeds.</DialogDescription></DialogHeader>
        <Textarea value={regenerationReason} maxLength={500} onChange={(event) => setRegenerationReason(event.target.value)} placeholder="Optional reason" />
        <DialogFooter><Button variant="outline" onClick={() => setRegenerateTarget(null)}>Cancel</Button><Button onClick={() => void regenerateSelected()} disabled={Boolean(busyCampaignId)}>Regenerate</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
