import { ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const display = (value?: string | null) => String(value || "Not started").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const tone = (value?: string | null) => {
  const status = String(value || "").toLowerCase();
  if (["passed", "verified", "completed"].includes(status)) return "bg-green-100 text-green-800";
  if (["failed", "rejected"].includes(status)) return "bg-red-100 text-red-800";
  if (["pending", "queued", "processing", "pending_review"].includes(status)) return "bg-yellow-100 text-yellow-900";
  return "bg-slate-100 text-slate-700";
};

export function ReadOnlyComplianceSnapshot({ snapshot }: { snapshot: any }) {
  const profile = snapshot?.profile;
  const compliance = snapshot?.compliance;
  const address = profile?.mailing_address || {};
  const documents = profile?.documents || [];
  const verification = compliance?.external_verification;
  if (!snapshot) return <div className="mt-4 rounded border p-4 text-sm text-muted-foreground">No compliance record has been started.</div>;
  const addressText = [address.address_line1, address.address_line2, [address.city, address.state, address.postal].filter(Boolean).join(" "), address.country].filter(Boolean).join(", ");
  return <section className="mt-5 space-y-4 rounded-lg border bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">Compliance</h3><p className="text-sm text-muted-foreground">Read-only record from the vendor or coordinator Compliance page.</p></div><Badge className={Number(compliance?.score) === 100 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-900"}>{compliance?.score ?? 0}%</Badge></div><div className="grid gap-3 md:grid-cols-2"><div><span className="text-xs font-medium uppercase text-muted-foreground">Legal payee</span><p>{profile?.legal_name || "Not provided"}</p><p className="text-sm text-muted-foreground">{display(profile?.party_type)} · {profile?.tax_id_masked || "Tax ID not saved"}</p></div><div><span className="text-xs font-medium uppercase text-muted-foreground">Registration</span><p>{profile?.entity_type || "Not provided"}{profile?.registration_state ? ` · ${profile.registration_state}` : ""}</p><p className="text-sm text-muted-foreground">{addressText || "Mailing address not provided"}</p></div></div><div><div className="mb-2 text-sm font-semibold">Requirements</div><div className="flex flex-wrap gap-2">{(compliance?.requirements || []).map((item: any) => <Badge key={item.key} className={tone(item.complete ? "passed" : "pending")}>{item.label}: {item.complete ? "Complete" : "Outstanding"}</Badge>)}</div></div><div><div className="mb-2 text-sm font-semibold">External verification</div><div className="flex flex-wrap gap-2">{(verification?.checks || []).length ? verification.checks.map((check: any) => <Badge key={check.verification_id || check.check_type} className={tone(check.status)}>{check.provider} {check.check_type}: {display(check.status)}</Badge>) : <span className="text-sm text-muted-foreground">Not started</span>}</div></div><div><div className="mb-2 text-sm font-semibold">Compliance documents</div><div className="space-y-2">{documents.length ? documents.map((document: any) => <div key={document.document_id} className="flex flex-wrap items-center justify-between gap-2 rounded border bg-white p-3 text-sm"><div><div className="flex items-center gap-2"><FileText className="h-4 w-4" /><span className="font-medium">{display(document.document_type)}</span><Badge className={tone(document.ocr_status)}>{display(document.ocr_status)}</Badge></div><div className="mt-1 text-muted-foreground">{document.original_name || "Document"}{document.ocr_error_message ? ` · ${document.ocr_error_message}` : ""}</div></div>{document.file_url ? <Button variant="outline" size="sm" onClick={() => window.open(document.file_url, "_blank", "noopener,noreferrer")}><ExternalLink className="mr-1 h-4 w-4" /> Open</Button> : null}</div>) : <p className="text-sm text-muted-foreground">No documents uploaded.</p>}</div></div>{snapshot.w9_session ? <div className="text-sm"><span className="font-semibold">W-9:</span> {display(snapshot.w9_session.verification_status || snapshot.w9_session.status)}</div> : null}</section>;
}
