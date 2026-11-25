import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ORG_NAV } from "@/components/app/org-nav";
import { FilterTabs } from "@/components/app/filter-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { Pagination } from "@/components/app/pagination";
import { SearchX } from "lucide-react";
import { PAGE_SIZE, STATUS_LABELS } from "@/lib/constants";
import { formatPoints, timeAgo, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "گزارش‌های دریافتی" };

export default async function OrgReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const status = params.status ?? "NEW";

  const orgs = await prisma.organization.findMany({
    where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    select: { id: true },
  });
  if (orgs.length === 0) {
    return (
      <DashboardShell title="گزارش‌های دریافتی" nav={ORG_NAV} currentPath="/org/reports">
        <p className="text-sm text-muted-foreground">هیچ سازمانی به حساب شما متصل نیست.</p>
      </DashboardShell>
    );
  }

  const where = {
    program: { organizationId: { in: orgs.map((o) => o.id) } },
    ...(["NEW", "TRIAGED", "ACCEPTED", "REJECTED", "DUPLICATE", "RESOLVED", "REWARDED"].includes(status)
      ? { status: status as any }
      : status === "ALL"
      ? {}
      : { status: { in: ["NEW"] } }),
  };

  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        severity: true,
        status: true,
        submittedAt: true,
        rewardAmount: true,
        researcher: { select: { name: true } },
        program: { select: { title: true } },
      },
    }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <DashboardShell title="گزارش‌های دریافتی" subtitle={`${formatPoints(total)} گزارش در برنامه‌های شما`} nav={ORG_NAV} currentPath="/org/reports">
      <div className="mb-6">
        <FilterTabs
          basePath="/org/reports"
          current={status}
          options={[
            { value: "NEW", label: "جدید" },
            { value: "TRIAGED", label: "بررسی‌شده" },
            { value: "ACCEPTED", label: "پذیرفته‌شده" },
            { value: "REWARDED", label: "جایزه‌داده‌شده" },
            { value: "REJECTED", label: "رد‌شده" },
            { value: "ALL", label: "همه" },
          ]}
        />
      </div>
      <Suspense fallback={null}>
        {reports.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title="گزارشی در این نما وجود ندارد"
            description="گزارش‌های ارسالی به برنامه‌های شما برای بررسی اولیه اینجا نمایش داده می‌شوند."
          />
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <Link
                key={r.id}
                href={`/org/reports/${r.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.researcher.name} · {r.program.title} · {timeAgo(r.submittedAt)}
                    {r.status === "REWARDED" && r.rewardAmount ? ` · ${formatMoney(r.rewardAmount)}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{STATUS_LABELS[r.status] ?? r.status}</span>
              </Link>
            ))}
            <div className="pt-4">
              <Pagination page={page} totalPages={totalPages} basePath="/org/reports" searchParams={params as any} />
            </div>
          </div>
        )}
      </Suspense>
    </DashboardShell>
  );
}
