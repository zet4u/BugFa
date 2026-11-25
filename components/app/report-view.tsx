import { prisma } from "@/lib/prisma";
import { getObjectUrl } from "@/lib/storage";
import { SeverityBadge } from "@/components/app/severity-badge";
import { StatusBadge } from "@/components/app/status-badge";
import { CommentForm } from "@/components/app/report-discussion";
import { AttachmentUploader } from "@/components/app/attachment-uploader";
import { formatMoney, timeAgo } from "@/lib/utils";
import { Paperclip } from "lucide-react";

export function ReportField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h4>
      <p className={`whitespace-pre-wrap text-sm leading-relaxed ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

export async function ReportView({
  reportId,
  viewerId,
  isStaff,
  controls,
}: {
  reportId: string;
  viewerId: string;
  isStaff: boolean;
  controls?: React.ReactNode;
}) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      program: { select: { title: true, slug: true, currency: true } },
      researcher: { select: { id: true, name: true, username: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, username: true } } },
      },
      attachments: { select: { id: true, filename: true, size: true, storageKey: true, createdAt: true } },
      dispute: { select: { id: true, status: true, reason: true, resolution: true, createdAt: true } },
    },
  });
  if (!report) return null;

  const attachments = await Promise.all(
    report.attachments.map(async (a) => ({ ...a, url: await getObjectUrl(a.storageKey) }))
  );

  const comments = report.comments.filter((c) => !c.internal || isStaff);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border bg-card p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs text-muted-foreground">
              <a href={`/programs/${report.program.slug}`} className="hover:text-primary">
                {report.program.title}
              </a>{" "}
              · submitted by{" "}
              <a href={`/researchers/${report.researcher.username}`} className="hover:text-primary">
                {report.researcher.name}
              </a>{" "}
              · {timeAgo(report.submittedAt)}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{report.title}</h2>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{report.asset}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={report.severity} />
            <StatusBadge status={report.status} />
            {controls}
          </div>
        </div>
        {report.status === "REWARDED" && report.rewardAmount != null ? (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reward</p>
            <p className="font-mono text-lg font-bold text-primary">
              {formatMoney(report.rewardAmount, report.currency)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ReportField label="Description" value={report.description} />
        <ReportField label="Steps to reproduce" value={report.steps} />
        <ReportField label="Impact" value={report.impact} />
        {report.proofOfConcept ? (
          <ReportField label="Proof of Concept" value={report.proofOfConcept} mono />
        ) : null}
        {report.remediation ? <ReportField label="Suggested remediation" value={report.remediation} /> : null}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Attachments ({attachments.length})</h3>
          <AttachmentUploader reportId={report.id} />
        </div>
        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attachments.</p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={a.url}
                  className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/40"
                  download
                >
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{a.filename}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{(a.size / 1024).toFixed(0)} KB</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-4 text-sm font-semibold">
          Private discussion ({comments.length})
          <span className="ml-2 font-normal text-muted-foreground">— visible only to you and the program team</span>
        </h3>
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-lg border bg-card p-4">
                <div className="mb-1.5 flex items-center gap-2 text-xs">
                  <span className="font-medium">{c.author.name}</span>
                  <span className="text-muted-foreground">@{c.author.username}</span>
                  {c.internal && isStaff ? (
                    <span className="rounded border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-400">
                      internal
                    </span>
                  ) : null}
                  <span className="ml-auto text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))
          )}
          <div className="pt-2">
            <CommentForm reportId={report.id} isStaff={isStaff} />
          </div>
        </div>
      </section>

      {report.dispute && isStaff ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <h3 className="text-sm font-semibold text-amber-400">Dispute {report.dispute.status.replace("RESOLVED_", "").replace(/_/g, " ").toLowerCase()}</h3>
          <p className="mt-1 text-sm text-amber-400/80">{report.dispute.reason}</p>
          {report.dispute.resolution ? (
            <p className="mt-2 text-sm">Resolution: {report.dispute.resolution}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
