import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { RESEARCHER_NAV } from "@/components/app/researcher-nav";
import { StatusBadge } from "@/components/app/status-badge";
import { SeverityBadge } from "@/components/app/severity-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Pagination } from "@/components/app/pagination";
import { FilterTabs } from "@/components/app/filter-tabs";
import { PAGE_SIZE } from "@/lib/constants";
import { timeAgo, formatMoney } from "@/lib/utils";
import { FileSearch } from "lucide-react";

export const metadata: Metadata = { title: "My submissions" };

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const status = params.status ?? "ALL";

  const where = {
    researcherId: user.id,
    ...(["NEW", "TRIAGED", "ACCEPTED", "REJECTED", "DUPLICATE", "RESOLVED", "REWARDED"].includes(status)
      ? { status: status as any }
      : status === "OPEN"
      ? { status: { in: ["NEW", "TRIAGED"] as any } }
      : status === "CLOSED"
      ? { status: { in: ["REJECTED", "DUPLICATE", "RESOLVED", "REWARDED"] as any } }
      : {}),
  };

  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, title: true, status: true, severity: true, rewardAmount: true, submittedAt: true, program: { select: { title: true, slug: true } } },
    }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <DashboardShell title="My submissions" subtitle={`${total} report${total === 1 ? "" : "s"}`} nav={RESEARCHER_NAV} currentPath="/researcher/submissions">
      <div className="mb-6">
        <FilterTabs
          basePath="/researcher/submissions"
          current={status}
          options={[
            { value: "ALL", label: "All" },
            { value: "OPEN", label: "In progress" },
            { value: "TRIAGED", label: "Triaged" },
            { value: "ACCEPTED", label: "Accepted" },
            { value: "REJECTED", label: "Rejected" },
            { value: "REWARDED", label: "Rewarded" },
          ]}
        />
      </div>
      {reports.length === 0 ? (
        <EmptyState icon={<FileSearch />} title="Nothing here yet" description="Reports you submit will appear with live status updates." />
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/researcher/submissions/${r.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-primary/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.program.title} · {timeAgo(r.submittedAt)}
                  {r.status === "REWARDED" && r.rewardAmount ? ` · ${formatMoney(r.rewardAmount)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <SeverityBadge severity={r.severity} />
                <StatusBadge status={r.status} />
              </div>
            </Link>
          ))}
          <div className="pt-4">
            <Pagination page={page} totalPages={totalPages} basePath="/researcher/submissions" searchParams={params as any} />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
