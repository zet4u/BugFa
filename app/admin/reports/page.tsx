import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV } from "@/components/app/admin-nav";
import { Pagination } from "@/components/app/pagination";
import { FilterTabs } from "@/components/app/filter-tabs";
import { ReportListRow } from "@/components/app/report-list-row";
import { EmptyState } from "@/components/app/empty-state";
import { PAGE_SIZE, REPORT_STATUSES } from "@/lib/constants";

export const metadata: Metadata = { title: "Report oversight" };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const status = (REPORT_STATUSES as readonly string[]).includes(params.status ?? "") ? params.status! : "ALL";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where = status === "ALL" ? {} : { status: status as any };
  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, title: true, severity: true, status: true, submittedAt: true,
        researcher: { select: { username: true } },
        program: { select: { title: true, slug: true } },
      },
    }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <DashboardShell title="Report oversight" subtitle={`${total} report${total === 1 ? "" : "s"}`} nav={ADMIN_NAV} currentPath="/admin/reports">
      <div className="mb-4">
        <FilterTabs
          basePath="/admin/reports"
          current={status}
          options={[{ value: "ALL", label: "All" }, ...(REPORT_STATUSES as readonly string[]).map((s) => ({ value: s, label: s }))]}
        />
      </div>
      {reports.length === 0 ? (
        <EmptyState title="No reports" />
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <ReportListRow
              key={r.id}
              href={`/admin/reports/${r.id}`}
              title={r.title}
              subtitle={`@${r.researcher.username} · ${r.program.title}`}
              severity={r.severity}
              status={r.status}
              time={r.submittedAt}
            />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath="/admin/reports" searchParams={params} />
    </DashboardShell>
  );
}
