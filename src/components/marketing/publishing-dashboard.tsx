import { Badge } from "@/components/ui/badge";

export interface PublishingAttempt {
  attemptNumber?: number;
  status?: string;
  startedAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
  error?: { code?: string; stage?: string | null } | null;
  publishedPostLinks?: string[];
}

export interface PublishingDistribution extends PublishingAttempt {
  claimedAt?: string | null;
  queuedAt?: string | null;
  publishedAt?: string | null;
  metricoolPostId?: string | null;
  metricoolDestinations?: Array<{ kind?: string; status?: string | null; postId?: string | null }>;
}

const when = (value?: string | null) => value && !Number.isNaN(new Date(value).getTime())
  ? new Date(value).toLocaleString() : "—";

export function PublishingDashboard({ distribution, attempts = [] }: {
  distribution?: PublishingDistribution | null;
  attempts?: PublishingAttempt[];
}) {
  const rows = attempts.length ? attempts : distribution && distribution.status && distribution.status !== "NOT_SENT"
    ? [{ ...distribution, attemptNumber: distribution.attemptNumber || 1 }] : [];
  return <section aria-label="Publishing Dashboard" className="space-y-3 rounded-md border bg-slate-50 p-4">
    <div><h3 className="font-semibold">Publishing Dashboard</h3><p className="text-xs text-muted-foreground">Publishing and error history is retained when content is regenerated.</p></div>
    {!rows.length ? <p className="rounded-md border bg-white p-3 text-muted-foreground">No publishing attempts yet.</p> : rows.map((attempt, index) => (
      <div key={`${attempt.attemptNumber || index}-${attempt.startedAt || attempt.updatedAt || index}`} className="space-y-2 rounded-md border bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">Attempt {attempt.attemptNumber || index + 1}</span><Badge variant={attempt.error ? "destructive" : "secondary"}>{attempt.status || "UNKNOWN"}</Badge></div>
        <dl className="grid gap-2 text-xs sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Started</dt><dd>{when(attempt.startedAt || distribution?.claimedAt)}</dd></div>
          <div><dt className="text-muted-foreground">Updated</dt><dd>{when(attempt.updatedAt)}</dd></div>
          <div><dt className="text-muted-foreground">Completed</dt><dd>{when(attempt.completedAt || distribution?.publishedAt)}</dd></div>
        </dl>
        {attempt.error?.code ? <p className="rounded border border-red-200 bg-red-50 p-2 text-red-800">Error: {attempt.error.code}{attempt.error.stage ? ` · ${attempt.error.stage}` : ""}</p> : null}
        {attempt.publishedPostLinks?.length ? <div className="flex flex-wrap gap-2">{attempt.publishedPostLinks.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="text-blue-700 underline">View published post</a>)}</div> : null}
      </div>
    ))}
  </section>;
}
