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
import { useUser } from "@/hooks/use-user";
import { SocialContentRecord, socialMediaContentApiService } from "@/services/social-media-content-api-service";

const formatDate = (value?: string | null) => value && !Number.isNaN(new Date(value).getTime())
  ? new Date(value).toLocaleString() : "—";

const statusLabel = (status: SocialContentRecord["lifecycleStatus"]) => ({
  DRAFT: "Draft",
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

function ContentDetails({ record, onClose }: { record: SocialContentRecord | null; onClose: () => void }) {
  const pkg = record?.contentPackage;
  const decision = pkg?.decision || {};
  const content = pkg?.content || {};
  const publishing = pkg?.publishing || {};
  const verification = pkg?.verification || {};
  return <Dialog open={Boolean(record)} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>Social Content Details</DialogTitle><DialogDescription>Review this package before approval. Approval does not schedule or publish it.</DialogDescription></DialogHeader>
      {record ? <div className="space-y-4 text-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ["Content ID", record.contentId], ["Brand", record.brandCode], ["Status", statusLabel(record.lifecycleStatus)],
            ["Audience", detailValue(decision.audience)], ["Growth objective", detailValue(decision.growthObjective)], ["Journey stage", detailValue(decision.journeyStage)],
            ["Content lane", detailValue(decision.contentLane)], ["Topic", detailValue(decision.topic)], ["Format", detailValue(content.format)],
            ["CTA", detailValue(content.cta)], ["Approval", detailValue(publishing.approvalStatus)], ["Verification", record.verificationComplete ? "Complete" : detailValue(verification.required)],
          ].map(([label, value]) => <div key={label} className="rounded-md border bg-slate-50 p-3"><dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}
        </dl>
        <DetailBlock label="Core message" value={decision.coreMessage} />
        <DetailBlock label="Reason for selection" value={decision.reasonForSelection} />
        <DetailBlock label="Caption" value={content.caption} />
        <DetailBlock label="Hashtags" value={Array.isArray(content.hashtags) ? content.hashtags.join(" ") : undefined} />
        <DetailBlock label="Platforms" value={Array.isArray(pkg?.platforms) ? pkg.platforms.map((platform) => `${String(platform.network || "")} (${platform.enabled === false ? "disabled" : "enabled"})`).join(", ") : undefined} />
      </div> : null}
    </DialogContent>
  </Dialog>;
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
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);
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
  const pending = useMemo(() => records.filter((record) => ["VERIFICATION_REQUIRED", "READY_FOR_APPROVAL", "DRAFT", "FAILED"].includes(record.lifecycleStatus)), [records]);
  const archived = useMemo(() => records.filter((record) => !pending.includes(record)), [pending, records]);
  const replace = (next: SocialContentRecord) => setRecords((current) => [next, ...current.filter((record) => record.contentId !== next.contentId)]);

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const response = await socialMediaContentApiService.requestDecision("RTC");
      replace(response.data.data.content); setGenerateConfirmOpen(false); setPendingOpen(true);
      toast({ title: "RTC social content generated", description: "The new package is in the review workflow and will not schedule or publish automatically." });
    } catch {
      toast({ title: "Social content generation failed", description: "No automatic retry, schedule, or publish action was submitted.", variant: "destructive" });
    } finally { setGenerating(false); }
  };

  const regenerate = async () => {
    if (!regenerateTarget || regenerateTarget.brandCode !== "RTC") return;
    setBusyId(regenerateTarget.contentId);
    let replacementCreated = false;
    try {
      // Create the replacement first, so a failed decision never removes the current reviewable package.
      const generated = await socialMediaContentApiService.requestDecision("RTC");
      replace(generated.data.data.content);
      replacementCreated = true;
      const rejected = await socialMediaContentApiService.reject(regenerateTarget.contentId);
      replace(rejected.data.data.content);
      setRegenerateTarget(null);
      setPendingOpen(true);
      toast({ title: "Replacement social content generated", description: "The prior package was rejected after the replacement was created. Nothing was scheduled or published." });
    } catch {
      toast({
        title: replacementCreated ? "Replacement created; original retained" : "Regeneration failed",
        description: replacementCreated
          ? "The new package is available for review, but the prior package could not be rejected. No schedule or publish action was submitted."
          : "The current package was preserved. No schedule or publish action was submitted.",
        variant: "destructive",
      });
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

  const renderTable = (items: SocialContentRecord[], readOnly = false) => !items.length
    ? <div className="p-8 text-center text-sm text-muted-foreground">No social content in this section yet.</div>
    : <Table><TableHeader><TableRow><TableHead>Brand</TableHead><TableHead>Topic</TableHead><TableHead>Format</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{items.map((record) => {
      const disabled = busyId === record.contentId;
      const decision = record.contentPackage.decision || {}; const content = record.contentPackage.content || {};
      return <TableRow key={record.contentId}><TableCell className="font-medium">{record.brandCode}</TableCell><TableCell>{detailValue(decision.topic)}</TableCell><TableCell>{detailValue(content.format)}</TableCell><TableCell>{formatDate(record.createdAt)}</TableCell><TableCell><Badge variant={record.lifecycleStatus === "FAILED" ? "destructive" : "secondary"}>{statusLabel(record.lifecycleStatus)}</Badge></TableCell><TableCell><div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setDetails(record)}><FileText className="mr-1 h-4 w-4" /> View Details</Button>
        {!readOnly && record.brandCode === "RTC" && ["VERIFICATION_REQUIRED", "READY_FOR_APPROVAL"].includes(record.lifecycleStatus) ? <Button size="sm" variant="outline" disabled={disabled} onClick={() => setRegenerateTarget(record)}><RefreshCw className="mr-1 h-4 w-4" /> Regenerate</Button> : null}
        {!readOnly && record.lifecycleStatus === "VERIFICATION_REQUIRED" ? <Button size="sm" variant="outline" disabled={disabled} onClick={() => void completeVerification(record)}><CheckCircle2 className="mr-1 h-4 w-4" /> Complete Verification</Button> : null}
        {!readOnly && record.lifecycleStatus === "READY_FOR_APPROVAL" ? <><Button size="sm" variant="destructive" disabled={disabled} onClick={() => void reject(record)}><XCircle className="mr-1 h-4 w-4" /> Reject</Button><Button size="sm" disabled={disabled} onClick={() => setApproveTarget(record)}>Approve</Button></> : null}
      </div></TableCell></TableRow>;
    })}</TableBody></Table>;

  return <div className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">Social Media Content</h1><p className="text-sm text-muted-foreground">Generate and review social packages separately from Creative Engine advertisements. Approval never schedules or publishes.</p></div><Button onClick={() => setGenerateConfirmOpen(true)} disabled={generating}><Plus className="mr-2 h-4 w-4" /> Generate RTC Social Content</Button></div>
    {loading ? <div className="flex justify-center rounded-md border bg-white p-12"><Loader2 className="h-7 w-7 animate-spin" /></div> : <><Collapsible open={pendingOpen} onOpenChange={setPendingOpen} className="rounded-md border bg-white"><CollapsibleTrigger asChild><button className="flex w-full items-center justify-between p-4 text-left"><div><h2 className="text-lg font-semibold">Pending Social Content ({pending.length})</h2><p className="text-sm text-muted-foreground">Verification and approval queue.</p></div><ChevronDown className={`h-5 w-5 transition-transform ${pendingOpen ? "rotate-180" : ""}`} /></button></CollapsibleTrigger><CollapsibleContent className="border-t">{renderTable(pending)}</CollapsibleContent></Collapsible>
      <Collapsible open={approvedOpen} onOpenChange={setApprovedOpen} className="rounded-md border bg-white"><CollapsibleTrigger asChild><button className="flex w-full items-center justify-between p-4 text-left"><div><h2 className="text-lg font-semibold">Approved / History ({archived.length})</h2><p className="text-sm text-muted-foreground">For review only; scheduling and publishing are not available here.</p></div><ChevronDown className={`h-5 w-5 transition-transform ${approvedOpen ? "rotate-180" : ""}`} /></button></CollapsibleTrigger><CollapsibleContent className="border-t">{renderTable(archived, true)}</CollapsibleContent></Collapsible></>}
    <ContentDetails record={details} onClose={() => setDetails(null)} />
    <AlertDialog open={generateConfirmOpen} onOpenChange={setGenerateConfirmOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Generate RTC social content?</AlertDialogTitle><AlertDialogDescription>This requests one new RTC decision package for the approval queue. It will not schedule or publish anything automatically.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={generating}>Cancel</AlertDialogCancel><AlertDialogAction disabled={generating} onClick={() => void generate()}>{generating ? "Generating…" : "Generate"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={Boolean(approveTarget)} onOpenChange={(open) => !open && setApproveTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Approve this social package?</AlertDialogTitle><AlertDialogDescription>This records approval only. It does not create a schedule, publish, or contact Metricool.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={Boolean(busyId)} onClick={() => void approve()}>Approve</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={Boolean(regenerateTarget)} onOpenChange={(open) => !open && setRegenerateTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Generate a replacement RTC social package?</AlertDialogTitle><AlertDialogDescription>A new decision package will be created first. Only after it succeeds will this package move to Rejected. This does not schedule or publish anything.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={Boolean(busyId)}>Cancel</AlertDialogCancel><AlertDialogAction disabled={Boolean(busyId)} onClick={() => void regenerate()}>Regenerate</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
