"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Download, Eye, FileText, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  approveCampaignState, campaignActionsDisabled, campaignCanApprove, campaignTypeLabel, emptyCampaignMessage,
  campaignRegenerationIsActive, campaignStatusIsFailure, campaignStatusLabel,
  campaignVideoDownloadName, discardCampaignState, discardConfirmationMessage,
  discardFailureMessage, preserveUsableRendition, reasonLabel,
  replaceCampaign, toggleVendorSelection,
} from "@/helpers/marketing-campaign-approval";
import {
  EligibleAppFeature, EligibleMarketingEvent, EligibleMarketingVendor,
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
                ["Generation Status", campaignStatusLabel(detail)], ["Approval Status", detail.approvalStatus],
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
  const [eligibleVendors, setEligibleVendors] = useState<EligibleMarketingVendor[]>([]);
  const [eligibleAppFeatures, setEligibleAppFeatures] = useState<EligibleAppFeature[]>([]);
  const [eligibleEvents, setEligibleEvents] = useState<EligibleMarketingEvent[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [selectedFeatureKeys, setSelectedFeatureKeys] = useState<string[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [selectedTruckUnitIds, setSelectedTruckUnitIds] = useState<Record<string, string[]>>({});
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
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);
  const [generateFeaturesOpen, setGenerateFeaturesOpen] = useState(false);
  const [generateEventsOpen, setGenerateEventsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [initialGenerating, setInitialGenerating] = useState<"APP_FEATURE" | "EVENT_PROMOTION" | null>(null);
  const generationRequestId = useRef<string | null>(null);
  const initialRequestIds = useRef<Record<string, string>>({});

  const load = useCallback(async () => {
    if (user?.userType !== "SUPER_ADMIN") { setLoading(false); return; }
    setLoading(true);
    try {
      const [pendingResponse, approvedResponse, eligibleVendorResponse, featureResponse, eventResponse] = await Promise.all([
        marketingCampaignApiService.listPending(), marketingCampaignApiService.listApproved(),
        marketingCampaignApiService.listEligibleVendors(),
        marketingCampaignApiService.listEligibleAppFeatures(), marketingCampaignApiService.listEligibleEvents(),
      ]);
      setPending(pendingResponse.data.data.campaigns);
      setApproved(approvedResponse.data.data.campaigns);
      setEligibleVendors(eligibleVendorResponse.data.data.vendors);
      setEligibleAppFeatures(featureResponse.data.data.features);
      setEligibleEvents(eventResponse.data.data.events);
    } catch {
      toast({ title: "Campaign load failed", description: "The campaign queues could not be loaded.", variant: "destructive" });
    } finally { setLoading(false); }
  }, [toast, user?.userType]);

  useEffect(() => { void load(); }, [load]);

  const processingIds = useMemo(() => pending
    .filter((campaign) => campaignRegenerationIsActive(campaign))
    .map((campaign) => campaign.campaignId), [pending]);
  const processingIdsKey = processingIds.join("|");
  const featuresByAudience = useMemo(() => eligibleAppFeatures.reduce<Record<string, EligibleAppFeature[]>>(
    (groups, feature) => ({
      ...groups,
      [feature.audience]: [...(groups[feature.audience] || []), feature],
    }),
    {},
  ), [eligibleAppFeatures]);

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
          if (updated.regenerationStatus === "READY_FOR_APPROVAL" || (
            updated.generationStatus === "COMPLETED" && !campaignRegenerationIsActive(updated)
          )) {
            toast({ title: "Campaign generation completed", description: `${updated.businessName} is ready for review.` });
          } else if (campaignStatusIsFailure(updated)) {
            toast({ title: "Campaign generation failed", description: "Existing approved ads were preserved.", variant: "destructive" });
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
      const queued = response.data.data.result;
      const replacement = preserveUsableRendition(regenerateTarget, {
        regenerationStatus: queued.status || queued.action,
      });
      setPending((rows) => replaceCampaign(rows, replacement));
      setRegenerateTarget(null); setRegenerationReason("");
      toast({ title: "Regeneration started", description: "The existing video stays available until its replacement succeeds." });
    } catch { toast({ title: "Regeneration failed", description: "The current usable video was preserved.", variant: "destructive" }); }
    finally { setBusyCampaignId(null); }
  };

  const discardSelected = async (campaign: MarketingCampaign) => {
    if (campaignActionsDisabled(campaign, busyCampaignId)) return;
    const campaignId = campaign.campaignId;
    if (!campaignId) {
      toast({
        title: "Discard failed",
        description: "This campaign is missing its identifier. Refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }
    if (!window.confirm(discardConfirmationMessage(campaign))) return;
    setBusyCampaignId(campaignId);
    try {
      const response = await marketingCampaignApiService.discard(campaignId);
      if (response.data.data.campaign?.campaignId !== campaignId) {
        throw new Error("Discard response did not match the selected campaign.");
      }
      setPending((rows) => discardCampaignState(rows, campaignId));
      toast({
        title: "Campaign discarded",
        description: "The campaign was removed from pending review and was not published.",
      });
      void load();
    } catch (error) {
      toast({
        title: "Discard failed",
        description: discardFailureMessage(error),
        variant: "destructive",
      });
    } finally { setBusyCampaignId(null); }
  };

  const generateVendorSpotlights = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      generationRequestId.current ??= typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const requestId = generationRequestId.current;
      const response = await marketingCampaignApiService.generate(
        requestId,
        selectedVendorIds.map((vendorId) => ({
          vendorId,
          truckUnitIds: selectedTruckUnitIds[vendorId] || [],
        })),
      );
      const campaigns = response.data.data.results
        .map((result) => result.campaign)
        .filter((campaign): campaign is MarketingCampaign => (
          Boolean(campaign) && campaign?.approvalStatus === "PENDING_APPROVAL"
        ));
      setPending((rows) => campaigns.reduce(
        (next, campaign) => replaceCampaign(next, campaign), rows,
      ));
      setPendingOpen(true);
      setGenerateConfirmOpen(false);
      setSelectedVendorIds([]);
      setSelectedTruckUnitIds({});
      generationRequestId.current = null;
      toast({
        title: "Vendor Spotlight generation started",
        description: `${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"} added to the review workflow.`,
      });
    } catch {
      toast({
        title: "Generation request failed",
        description: "No automatic retry was submitted. Existing campaigns were preserved.",
        variant: "destructive",
      });
    } finally { setGenerating(false); }
  };

  const generateInitialCampaigns = async (campaignType: "APP_FEATURE" | "EVENT_PROMOTION") => {
    if (initialGenerating) return;
    const selected = campaignType === "APP_FEATURE" ? selectedFeatureKeys : selectedEventIds;
    if (!selected.length) return;
    setInitialGenerating(campaignType);
    try {
      initialRequestIds.current[campaignType] ??= typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `initial-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const requestId = initialRequestIds.current[campaignType];
      const response = campaignType === "APP_FEATURE"
        ? await marketingCampaignApiService.generateAppFeatures(requestId, selected)
        : await marketingCampaignApiService.generateEvents(requestId, selected);
      const campaigns = response.data.data.results
        .map((result) => result.campaign)
        .filter((campaign): campaign is MarketingCampaign => Boolean(campaign));
      setPending((rows) => campaigns.reduce(
        (next, campaign) => replaceCampaign(next, campaign), rows,
      ));
      setPendingOpen(true);
      if (campaignType === "APP_FEATURE") {
        const generated = new Set(selectedFeatureKeys);
        setEligibleAppFeatures((rows) => rows.map((row) => generated.has(row.featureKey)
          ? { ...row, generationBlocked: true } : row));
        setSelectedFeatureKeys([]);
        setGenerateFeaturesOpen(false);
      } else {
        const generated = new Set(selectedEventIds);
        setEligibleEvents((rows) => rows.map((row) => generated.has(row.eventId)
          ? { ...row, generationBlocked: true } : row));
        setSelectedEventIds([]);
        setGenerateEventsOpen(false);
      }
      delete initialRequestIds.current[campaignType];
      toast({
        title: "Campaign generation queued",
        description: `${campaigns.length} ${campaignType === "APP_FEATURE" ? "App Feature" : "Event Promotion"} campaign${campaigns.length === 1 ? "" : "s"} added to Pending Campaigns.`,
      });
    } catch {
      toast({
        title: "Generation request failed",
        description: "No automatic retry was submitted. Existing campaigns were preserved.",
        variant: "destructive",
      });
    } finally { setInitialGenerating(null); }
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
        <TableCell><Badge variant={campaignStatusIsFailure(campaign) ? "destructive" : "secondary"}>{archived ? "Approved" : campaignStatusLabel(campaign)}</Badge></TableCell>
        {!archived ? <TableCell>{campaign.regenerationCount}</TableCell> : null}
        <TableCell><div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setPreview(campaign)} disabled={!campaign.videoUrl}><Eye className="mr-1 h-4 w-4" /> Preview Video</Button>
          {campaign.videoUrl ? <Button size="sm" variant="outline" asChild>
            <a href={campaign.videoUrl} download={campaignVideoDownloadName(campaign)} target="_blank" rel="noreferrer"><Download className="mr-1 h-4 w-4" /> Download Video</a>
          </Button> : <Button size="sm" variant="outline" disabled><Download className="mr-1 h-4 w-4" /> Download Video</Button>}
          <Button size="sm" variant="outline" onClick={() => void openDetails(campaign.campaignId)}><FileText className="mr-1 h-4 w-4" /> View Details</Button>
          {!archived ? <>
            <Button size="sm" variant="outline" disabled={disabled} onClick={() => setRegenerateTarget(campaign)}><RefreshCw className="mr-1 h-4 w-4" /> Regenerate</Button>
            <Button size="sm" variant="destructive" disabled={disabled} onClick={() => void discardSelected(campaign)}><Trash2 className="mr-1 h-4 w-4" /> Discard</Button>
            <Button size="sm" disabled={disabled || !campaignCanApprove(campaign)} onClick={() => setApproveTarget(campaign)}>Archive / Approve</Button>
          </> : null}
        </div></TableCell>
      </TableRow>;
    })}</TableBody></Table>
  );

  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">Marketing Campaign Approval</h1><p className="text-sm text-muted-foreground">Review current campaign renditions, request a replacement, or archive approved keepers.</p></div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={() => setGenerateConfirmOpen(true)} disabled={generating || Boolean(initialGenerating)}><Plus className="mr-2 h-4 w-4" /> Generate Vendor Spotlights</Button>
        <Button onClick={() => setGenerateFeaturesOpen(true)} disabled={generating || Boolean(initialGenerating)}><Plus className="mr-2 h-4 w-4" /> Generate App Feature Ads</Button>
        <Button onClick={() => setGenerateEventsOpen(true)} disabled={generating || Boolean(initialGenerating)}><Plus className="mr-2 h-4 w-4" /> Generate Public Event Ads</Button>
      </div>
    </div>
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

    <Dialog open={generateConfirmOpen} onOpenChange={(open) => {
      setGenerateConfirmOpen(open);
      if (!open && !generating) generationRequestId.current = null;
    }}>
      <DialogContent><DialogHeader><DialogTitle>Generate new Vendor Spotlights</DialogTitle><DialogDescription>Select one or more eligible vendors. Each selected vendor receives a new Scene 2/3 visual variation and fresh music. Existing pending and approved ads remain unchanged.</DialogDescription></DialogHeader>
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">
          {eligibleVendors.length ? eligibleVendors.map((vendor) => {
            const checked = selectedVendorIds.includes(vendor.vendorId);
            const truckUnits = vendor.truckUnits || [];
            const unavailable = vendor.generationBlocked || truckUnits.length === 0;
            const selectedUnits = selectedTruckUnitIds[vendor.vendorId] || [];
            return <div key={vendor.vendorId} className={`rounded-md border ${unavailable ? "opacity-60" : ""}`}>
              <label className={`flex items-center gap-3 p-3 ${unavailable ? "" : "cursor-pointer"}`}>
                <Checkbox checked={checked} disabled={unavailable || generating} onCheckedChange={(value) => {
                  const nextChecked = value === true;
                  setSelectedVendorIds((current) => toggleVendorSelection(
                    current, vendor.vendorId, nextChecked,
                  ));
                  setSelectedTruckUnitIds((current) => ({
                    ...current,
                    [vendor.vendorId]: nextChecked
                      ? truckUnits.map((unit) => unit.truckUnitId)
                      : [],
                  }));
                }} />
                <span className="flex-1 font-medium">{vendor.businessName}</span>
                {vendor.generationBlocked ? <span className="text-xs text-muted-foreground">Already processing</span> : null}
                {!vendor.generationBlocked && truckUnits.length === 0 ? <span className="text-xs text-muted-foreground">No active food trucks</span> : null}
              </label>
              {checked ? <div className="space-y-2 border-t bg-slate-50 px-4 py-3 pl-11">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Food trucks included in menu images and schedule</p>
                {truckUnits.map((unit) => {
                  const unitChecked = selectedUnits.includes(unit.truckUnitId);
                  return <label key={unit.truckUnitId} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-white">
                    <Checkbox checked={unitChecked} disabled={generating} onCheckedChange={(value) => {
                      setSelectedTruckUnitIds((current) => ({
                        ...current,
                        [vendor.vendorId]: value === true
                          ? [...new Set([...(current[vendor.vendorId] || []), unit.truckUnitId])]
                          : (current[vendor.vendorId] || []).filter((id) => id !== unit.truckUnitId),
                      }));
                    }} />
                    <span className="text-sm">{unit.name}{unit.isPrimary ? " (Primary)" : ""}</span>
                  </label>;
                })}
              </div> : null}
            </div>;
          }) : <p className="text-sm text-muted-foreground">No eligible featured vendors are currently available.</p>}
        </div>
        <p className="text-sm text-muted-foreground">Selected: {selectedVendorIds.length}. This submits one paid music generation and one paid video render per selected vendor—not per food truck.</p>
        <DialogFooter><Button variant="outline" onClick={() => setGenerateConfirmOpen(false)} disabled={generating}>Cancel</Button><Button onClick={() => void generateVendorSpotlights()} disabled={generating || selectedVendorIds.length === 0 || selectedVendorIds.some((vendorId) => (selectedTruckUnitIds[vendorId] || []).length === 0)}>{generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Generate Selected Ads</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={generateFeaturesOpen} onOpenChange={(open) => {
      setGenerateFeaturesOpen(open);
      if (!open && initialGenerating !== "APP_FEATURE") delete initialRequestIds.current.APP_FEATURE;
    }}>
      <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Generate App Feature Ads</DialogTitle><DialogDescription>Select one or more registered app features. Each feature creates one categorized campaign and remains pending until you approve it.</DialogDescription></DialogHeader>
        <div className="max-h-[55vh] space-y-4 overflow-y-auto rounded-md border p-3">
          {Object.entries(featuresByAudience).map(([audience, features]) => (
            <section key={audience} className="space-y-2"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{campaignTypeLabel(audience)}</h3>
              {features?.map((feature) => {
                const checked = selectedFeatureKeys.includes(feature.featureKey);
                return <label key={feature.featureKey} className={`flex items-center gap-3 rounded-md border p-3 ${feature.generationBlocked ? "opacity-60" : "cursor-pointer"}`}>
                  <Checkbox checked={checked} disabled={feature.generationBlocked || initialGenerating === "APP_FEATURE"} onCheckedChange={(value) => {
                    setSelectedFeatureKeys((current) => toggleVendorSelection(current, feature.featureKey, value === true));
                  }} />
                  <span className="flex-1 font-medium">{feature.featureName}</span>
                  {feature.generationBlocked ? <span className="text-xs text-muted-foreground">Campaign already exists</span> : null}
                </label>;
              })}
            </section>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Selected: {selectedFeatureKeys.length}. Each selection creates one paid music generation and one paid video render.</p>
        <DialogFooter><Button variant="outline" onClick={() => setGenerateFeaturesOpen(false)} disabled={initialGenerating === "APP_FEATURE"}>Cancel</Button><Button onClick={() => void generateInitialCampaigns("APP_FEATURE")} disabled={Boolean(initialGenerating) || selectedFeatureKeys.length === 0}>{initialGenerating === "APP_FEATURE" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Generate Selected App Features</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={generateEventsOpen} onOpenChange={(open) => {
      setGenerateEventsOpen(open);
      if (!open && initialGenerating !== "EVENT_PROMOTION") delete initialRequestIds.current.EVENT_PROMOTION;
    }}>
      <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Generate Public Event Ads</DialogTitle><DialogDescription>Select eligible upcoming public events. Private, cancelled, past, and zero-media events are excluded automatically.</DialogDescription></DialogHeader>
        <div className="max-h-[55vh] space-y-2 overflow-y-auto rounded-md border p-3">
          {eligibleEvents.length ? eligibleEvents.map((event) => {
            const checked = selectedEventIds.includes(event.eventId);
            const location = [event.city, event.state].filter(Boolean).join(", ");
            return <label key={event.eventId} className={`flex items-start gap-3 rounded-md border p-3 ${event.generationBlocked ? "opacity-60" : "cursor-pointer"}`}>
              <Checkbox className="mt-1" checked={checked} disabled={event.generationBlocked || initialGenerating === "EVENT_PROMOTION"} onCheckedChange={(value) => {
                setSelectedEventIds((current) => toggleVendorSelection(current, event.eventId, value === true));
              }} />
              <span className="flex-1"><span className="block font-medium">{event.eventName}</span><span className="text-xs text-muted-foreground">{[formatDate(event.eventDate), location, campaignTypeLabel(event.ticketMode)].filter(Boolean).join(" · ")}</span></span>
              {event.generationBlocked ? <span className="text-xs text-muted-foreground">Campaign already exists</span> : null}
            </label>;
          }) : <p className="text-sm text-muted-foreground">No eligible upcoming public events with usable event media are available.</p>}
        </div>
        <p className="text-sm text-muted-foreground">Selected: {selectedEventIds.length}. Only public event details and approved event images are used.</p>
        <DialogFooter><Button variant="outline" onClick={() => setGenerateEventsOpen(false)} disabled={initialGenerating === "EVENT_PROMOTION"}>Cancel</Button><Button onClick={() => void generateInitialCampaigns("EVENT_PROMOTION")} disabled={Boolean(initialGenerating) || selectedEventIds.length === 0}>{initialGenerating === "EVENT_PROMOTION" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Generate Selected Events</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
