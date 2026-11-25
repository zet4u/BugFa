import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV } from "@/components/app/admin-nav";
import { Pagination } from "@/components/app/pagination";
import { FilterTabs } from "@/components/app/filter-tabs";
import { ProgramModerateForm } from "@/components/app/admin-forms";
import { EmptyState } from "@/components/app/empty-state";
import { formatMoney, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Program moderation" };

const STATUSES = ["DRAFT", "PUBLIC", "PRIVATE", "PAUSED"];

export default async function AdminProgramsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const status = STATUSES.includes(params.status ?? "") ? params.status! : "ALL";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where = status === "ALL" ? {} : { status: status as any };
  const [total, programs] = await Promise.all([
    prisma.program.count({ where }),
    prisma.program.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
      select: {
        id: true, title: true, slug: true, status: true, featured: true,
        minBounty: true, maxBounty: true, currency: true, createdAt: true,
        organization: { select: { name: true, verified: true } },
        _count: { select: { reports: true } },
      },
    }),
  ]);
  const totalPages = Math.ceil(total / 20);

  return (
    <DashboardShell title="Program moderation" subtitle={`${total} program${total === 1 ? "" : "s"}`} nav={ADMIN_NAV} currentPath="/admin/programs">
      <div className="mb-4">
        <FilterTabs
          basePath="/admin/programs"
          current={status}
          options={[
            { value: "ALL", label: "All" },
            ...STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })),
          ]}
        />
      </div>

      {programs.length === 0 ? (
        <EmptyState title="No programs" />
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.title}{p.featured ? " ★" : ""}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.organization.name}{p.organization.verified ? " ✓" : ""} · {formatMoney(p.minBounty, p.currency)}–{formatMoney(p.maxBounty, p.currency)} · {p._count.reports} reports · {p.status} · created {timeAgo(p.createdAt)}
                </p>
              </div>
              <ProgramModerateForm programId={p.id} status={p.status} />
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath="/admin/programs" searchParams={params} />
    </DashboardShell>
  );
}
