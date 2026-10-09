"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, FileText, Loader2, Plus, RefreshCw, XCircle } from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { formatSocialContentCreative, formatSocialContentCta, socialContentCanApprove, socialContentCanReject, socialContentCreativeProductionIsActive, socialContentSafeFailureCode, socialContentVisibleInReview } from "@/helpers/social-media-content";
import { useUser } from "@/hooks/use-user";
import { SocialContentRecord, SocialContentRequestedFormat, socialMediaContentApiService } from "@/services/social-media-content-api-service";

const formatDate = (value?: string | null) => value && !Number.isNaN(new Date(value).getTime())
  ? new Date(value).toLocaleString() : "—";

const statusLabel = (status: SocialContentRecord["lifecycleStatus"]) => ({
  DRAFT: "Draft",
  CREATIVE_PRODUCTION: "Creating Final Preview",
  VERIFICATION_REQUIRED: "Verification Required",
  READY_FOR_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  FAILED: "Needs Attention",
}[status] || status);

const detailValue = (value: unknown) => typeof value === "string" || typeof value === "number"
  ? String(value) : "—";

function ContentDetails({ record, previewUrls, onClose }: { record: SocialContentRecord | null; previewUrls: string[]; onClose: () => void }) {
  const pkg = record?.contentPackage;
  const decision = pkg?.decision || {};
  const content = pkg?.content || {};
  const creative = formatSocialContentCreative(pkg?.creative);
  const publishing = pkg?.publishing || {};
  const verification = pkg?.verification || {};
  return <Dialog open={Boolean(record)} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>Social Content Details</DialogTitle><DialogDescription>Review this package before approval. Approval does not schedule or publish it.</DialogDescription></DialogHeader>
      {record ? <div className="space-y-4 text-sm">
        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            ["Content ID", record.contentId], ["Status", statusLabel(record.lifecycleStatus)], ["Approval", detailValue(publishing.approvalStatus)],
          ].map(([label, value]) => <div key={label} className="rounded-md border bg-slate-50 p-3"><dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}
        </dl>
        <section aria-label="Final Post" className="space-y-4 rounded-md border bg-slate-50 p-4">
          <h3 className="font-semibold">Final Post</h3>
          <CreativeAsset values={previewUrls} format={detailValue(content.format)} altText={creative.altText} />
          <div className="space-y-3 rounded-md border bg-white p-4">
            <DetailBlock label="Headline" value={content.headline} />
            <DetailBlock label="Caption" value={content.caption} />
            <DetailBlock label="Hashtags" value={Array.isArray(content.hashtags) ? content.hashtags.join(" ") : undefined} />
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["CTA", formatSocialContentCta(content.cta)],
              ["Platforms", Array.isArray(pkg?.platforms) ? pkg.platforms.filter((platform) => platform.enabled !== false).map((platform) => String(platform.network || "")).filter(Boolean).join(", ") : undefined],
            ].map(([label, value]) => <div key={label} className="rounded-md border bg-white p-3"><dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{detailValue(value)}</dd></div>)}
          </dl>
        </section>
        <section aria-label="Creative" className="space-y-3 rounded-md border bg-slate-50 p-4">
          <h3 className="font-semibold">Creative</h3>
          {creative.missingRequiredDirection ? <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">Creative is required, but its persisted direction is missing. Do not approve until this is resolved.</p> : null}
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["Format", detailValue(content.format)], ["Creative Type", creative.type], ["Alt Text", creative.altText],
            ].map(([label, value]) => <div key={label} className="rounded-md border bg-white p-3"><dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}
          </dl>
          <CreativeDetail label="Direction" value={creative.direction} />
        </section>
        <section aria-label="Content Strategy" className="space-y-3 rounded-md border bg-slate-50 p-4">
          <h3 className="font-semibold">Content Strategy</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["Audience", detailValue(decision.audience)], ["Growth objective", detailValue(decision.growthObjective)], ["Journey stage", detailValue(decision.journeyStage)],
              ["Content lane", detailValue(decision.contentLane)], ["Topic", detailValue(decision.topic)], ["Verification", record.verificationComplete ? "Complete" : detailValue(verification.required)],
            ].map(([label, value]) => <div key={label} className="rounded-md border bg-white p-3"><dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}
          </dl>
          <CreativeDetail label="Core Message" value={detailValue(decision.coreMessage)} />
          <CreativeDetail label="Reason for Selection" value={detailValue(decision.reasonForSelection)} />
        </section>
      </div> : null}
    </DialogContent>
  </Dialog>;
}

function CreativeDetail({ label, value }: { label: string; value: string }) {
  return <div><h4 className="mb-1 text-sm font-medium">{label}</h4><p className="whitespace-pre-wrap rounded-md border bg-white p-3">{value}</p></div>;
}

function CreativeAsset({ values, format, altText }: { values: string[]; format: string; altText: string }) {
  if (!values.length) return <div><h4 className="mb-1 text-sm font-medium">Final Preview</h4><p className="rounded-md border bg-white p-3 text-muted-foreground">No finished creative is attached yet.</p></div>;
  const video = format === "SHORT_VIDEO";
  if (video) return <div><h4 className="mb-1 text-sm font-medium">Final Preview</h4><div className="overflow-hidden rounded-md border bg-black"><video className="max-h-[520px] w-full" controls preload="metadata" src={values[0]} aria-label={altText} /></div></div>;
  const carousel = format === "CAROUSEL";
  return <div><h4 className="mb-1 text-sm font-medium">{carousel ? "Final Carousel" : "Final Preview"}</h4><div className={carousel ? "grid gap-4 sm:grid-cols-2" : "overflow-hidden rounded-md border bg-black"}>{values.map((value, index) => <figure key={value} className="overflow-hidden rounded-md border bg-white"><img className="max-h-[520px] w-full object-contain" src={value} alt={`${altText === "—" ? "Final social creative" : altText}${carousel ? `, card ${index + 1}` : ""}`} />{carousel ? <figcaption className="border-t px-3 py-2 text-xs text-muted-foreground">Card {index + 1}</figcaption> : null}</figure>)}</div></div>;
}

function DetailBlock({ label, value }: { label: string; value: unknown }) {
  if (typeof value !== "string" || !value.trim()) return null;
  return <div><h3 className="mb-1 font-semibold">{label}</h3><p className="whitespace-pre-wrap rounded-md border bg-slate-50 p-3">{value}</p></div>;
}

export default function SocialMediaContentPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [records, setRecords] = useState<SocialContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [details, setDetails] = useState<SocialContentRecord | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);
  const [requestedFormat, setRequestedFormat] = useState<SocialContentRequestedFormat>("IMAGE_POST");
  const [approveTarget, setApproveTarget] = useState<SocialContentRecord | null>(null);
  const [regenerateTarget, setRegenerateTarget] = useState<SocialContentRecord | null>(null);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [approvedOpen, setApprovedOpen] = useState(false);

  const load = useCallback(async () => {
    if (user?.userType !== "SUPER_ADMIN") { setLoading(false); return; }
    setLoading(true);
    try {
      const response = await socialMediaContentApiService.list();
      setRecords(response.data.data.content || []);
    } catch {
      toast({ title: "Social content load failed", description: "The social content review queue could not be loaded.", variant: "destructive" });
    } finally { setLoading(false); }
  }, [toast, user?.userType]);

  useEffect(() => { void load(); }, [load]);
  const visibleRecords = useMemo(() => records.filter(socialContentVisibleInReview), [records]);
  const pending = useMemo(() => visibleRecords.filter((record) => ["CREATIVE_PRODUCTION", "VERIFICATION_REQUIRED", "READY_FOR_APPROVAL", "DRAFT", "FAILED"].includes(record.lifecycleStatus)), [visibleRecords]);
  const archived = useMemo(() => visibleRecords.filter((record) => !pending.includes(record)), [pending, visibleRecords]);
  const activeCreativeProduction = useMemo(() => records.some(socialContentCreativeProductionIsActive), [records]);

  useEffect(() => {
    if (!activeCreativeProduction) return;
    const poll = window.setInterval(() => { void load(); }, 4000);
    return () => window.clearInterval(poll);
  }, [activeCreativeProduction, load]);

  const replace = (next: SocialContentRecord) => setRecords((current) => [next, ...current.filter((record) => record.contentId !== next.contentId)]);

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const response = await socialMediaContentApiService.requestDecision("RTC", requestedFormat);
      replace(response.data.data.content); setGenerateConfirmOpen(false); setPendingOpen(true);
      toast({ title: "RTC social content generated", description: "The new package is in the review workflow and will not schedule or publish automatically." });
    } catch (error) {
      const code = socialContentSafeFailureCode(error);
      toast({ title: "Social content generation failed", description: `${code ? `Failure: ${code}. ` : ""}No automatic retry, schedule, or publish action was submitted.`, variant: "destructive" });
    } finally { setGenerating(false); }
  };

  const regenerate = async () => {
    if (!regenerateTarget || regenerateTarget.brandCode !== "RTC") return;
    setBusyId(regenerateTarget.contentId);
    try {
      const response = await socialMediaContentApiService.regenerateCreative(regenerateTarget.contentId);
      const replacedContentId = regenerateTarget.contentId;
      setRecords((current) => [response.data.data.content, ...current.filter((record) => record.contentId !== replacedContentId && record.contentId !== response.data.data.content.contentId)]);
      setRegenerateTarget(null);
      setPendingOpen(true);
      toast({ title: "Final creative regeneration queued", description: "The existing package was preserved. It cannot be approved until a finished preview is attached." });
    } catch {
      toast({ title: "Creative regeneration failed", description: "The current package was preserved. No schedule or publish action was submitted.", variant: "destructive" });
    } finally { setBusyId(null); }
  };

  const completeVerification = async (record: SocialContentRecord) => {
    setBusyId(record.contentId);
    try { const response = await socialMediaContentApiService.completeVerification(record.contentId); replace(response.data.data.content); toast({ title: "Verification completed", description: "The package is now pending approval." }); }
    catch { toast({ title: "Verification update failed", description: "The package remains in its current state.", variant: "destructive" }); }
    finally { setBusyId(null); }
  };
  const approve = async () => {
    if (!approveTarget) return;
    setBusyId(approveTarget.contentId);
    try { const response = await socialMediaContentApiService.approve(approveTarget.contentId); replace(response.data.data.content); setApproveTarget(null); toast({ title: "Social content approved", description: "Approval was recorded. No schedule or publish action occurred." }); }
    catch { toast({ title: "Approval failed", description: "The package remains in the review queue.", variant: "destructive" }); }
    finally { setBusyId(null); }
  };
  const reject = async (record: SocialContentRecord) => {
    if (!window.confirm("Reject this social content package? It will not be scheduled or published.")) return;
    setBusyId(record.contentId);
    try { const response = await socialMediaContentApiService.reject(record.contentId); replace(response.data.data.content); toast({ title: "Social content rejected", description: "No schedule or publish action occurred." }); }
    catch { toast({ title: "Rejection failed", description: "The package remains in its current state.", variant: "destructive" }); }
    finally { setBusyId(null); }
  };

  const openDetails = async (record: SocialContentRecord) => {
    setDetails(record); setPreviewUrls([]);
    if (record.creativeProduction?.status !== "READY") return;
    try { const response = await socialMediaContentApiService.creativePreview(record.contentId); setPreviewUrls((response.data.data.previewUrls || [response.data.data.previewUrl]).filter((value): value is string => typeof value === "string" && Boolean(value))); }
    catch { toast({ title: "Preview unavailable", description: "The record is preserved, but the finished creative could not be loaded.", variant: "destructive" }); }
  };
  const renderTable = (items: SocialContentRecord[], readOnly = false) => !items.length
    ? <div className="p-8 text-center text-sm text-muted-foreground">No social content in this section yet.</div>
    : <Table><TableHeader><TableRow><TableHead>Brand</TableHead><TableHead>Topic</TableHead><TableHead>Format</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{items.map((record) => {
      const disabled = busyId === record.contentId;
      const canApprove = socialContentCanApprove(record);
      const decision = record.contentPackage.decision || {}; const content = record.contentPackage.content || {};
      return <TableRow key={record.contentId}><TableCell className="font-medium">{record.brandCode}</TableCell><TableCell>{detailValue(decision.topic)}</TableCell><TableCell>{detailValue(content.format)}</TableCell><TableCell>{formatDate(record.createdAt)}</TableCell><TableCell><Badge variant={record.lifecycleStatus === "FAILED" ? "destructive" : "secondary"}>{statusLabel(record.lifecycleStatus)}</Badge></TableCell><TableCell><div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => void openDetails(record)}><FileText className="mr-1 h-4 w-4" /> View Details</Button>
        {!readOnly && record.brandCode === "RTC" && ((record.lifecycleStatus === "CREATIVE_PRODUCTION" && record.creativeProduction?.status === "FAILED") || canApprove) ? <Button size="sm" variant="outline" disabled={disabled} onClick={() => setRegenerateTarget(record)}><RefreshCw className="mr-1 h-4 w-4" /> Regenerate</Button> : null}
        {!readOnly && record.lifecycleStatus === "VERIFICATION_REQUIRED" ? <Button size="sm" variant="outline" disabled={disabled} onClick={() => void completeVerification(record)}><CheckCircle2 className="mr-1 h-4 w-4" /> Complete Verification</Button> : null}
        {!readOnly && socialContentCanReject(record) ? <Button size="sm" variant="destructive" disabled={disabled} onClick={() => void reject(record)}><XCircle className="mr-1 h-4 w-4" /> Reject</Button> : null}
        {!readOnly && record.lifecycleStatus === "READY_FOR_APPROVAL" ? <Button size="sm" disabled={disabled || !canApprove} onClick={() => setApproveTarget(record)}>Approve</Button> : null}
      </div></TableCell></TableRow>;
    })}</TableBody></Table>;

  return <div className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">Social Media Content</h1><p className="text-sm text-muted-foreground">Generate and review social packages separately from Creative Engine advertisements. Approval never schedules or publishes.</p></div><Button onClick={() => setGenerateConfirmOpen(true)} disabled={generating}><Plus className="mr-2 h-4 w-4" /> Generate RTC Social Content</Button></div>
    {loading ? <div className="flex justify-center rounded-md border bg-white p-12"><Loader2 className="h-7 w-7 animate-spin" /></div> : <><Collapsible open={pendingOpen} onOpenChange={setPendingOpen} className="rounded-md border bg-white"><CollapsibleTrigger asChild><button className="flex w-full items-center justify-between p-4 text-left"><div><h2 className="text-lg font-semibold">Pending Social Content ({pending.length})</h2><p className="text-sm text-muted-foreground">Verification and approval queue.</p></div><ChevronDown className={`h-5 w-5 transition-transform ${pendingOpen ? "rotate-180" : ""}`} /></button></CollapsibleTrigger><CollapsibleContent className="border-t">{renderTable(pending)}</CollapsibleContent></Collapsible>
      <Collapsible open={approvedOpen} onOpenChange={setApprovedOpen} className="rounded-md border bg-white"><CollapsibleTrigger asChild><button className="flex w-full items-center justify-between p-4 text-left"><div><h2 className="text-lg font-semibold">Approved / History ({archived.length})</h2><p className="text-sm text-muted-foreground">For review only; scheduling and publishing are not available here.</p></div><ChevronDown className={`h-5 w-5 transition-transform ${approvedOpen ? "rotate-180" : ""}`} /></button></CollapsibleTrigger><CollapsibleContent className="border-t">{renderTable(archived, true)}</CollapsibleContent></Collapsible></>}
    <ContentDetails record={details} previewUrls={previewUrls} onClose={() => { setDetails(null); setPreviewUrls([]); }} />
    <AlertDialog open={generateConfirmOpen} onOpenChange={setGenerateConfirmOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Generate RTC social content?</AlertDialogTitle><AlertDialogDescription>Choose the final post type. OpenAI will create governed copy and direction for this format, then the finished creative will enter the approval queue. Nothing is scheduled or published automatically.</AlertDialogDescription></AlertDialogHeader><div className="space-y-2"><label htmlFor="social-content-format" className="text-sm font-medium">Post type</label><select id="social-content-format" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={requestedFormat} disabled={generating} onChange={(event) => setRequestedFormat(event.target.value as SocialContentRequestedFormat)}><option value="IMAGE_POST">Photo</option><option value="CAROUSEL">Carousel</option><option value="SHORT_VIDEO">Video</option></select></div><AlertDialogFooter><AlertDialogCancel disabled={generating}>Cancel</AlertDialogCancel><AlertDialogAction disabled={generating} onClick={() => void generate()}>{generating ? "Generating…" : `Generate ${requestedFormat === "IMAGE_POST" ? "Photo" : requestedFormat === "CAROUSEL" ? "Carousel" : "Video"}`}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={Boolean(approveTarget)} onOpenChange={(open) => !open && setApproveTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Approve this social package?</AlertDialogTitle><AlertDialogDescription>This records approval only. It does not create a schedule, publish, or contact Metricool.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={Boolean(busyId)} onClick={() => void approve()}>Approve</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={Boolean(regenerateTarget)} onOpenChange={(open) => !open && setRegenerateTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Regenerate this social post?</AlertDialogTitle><AlertDialogDescription>{regenerateTarget?.creativeProduction?.status === "FAILED" ? "This explicitly retries the failed final render using the preserved content package." : "This requests fresh copy and a fresh final creative. The current post will be replaced only after the new request is accepted."} Nothing will be scheduled, published, or sent to Metricool.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={Boolean(busyId)}>Cancel</AlertDialogCancel><AlertDialogAction disabled={Boolean(busyId)} onClick={() => void regenerate()}>Regenerate</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
