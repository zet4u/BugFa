import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV } from "@/components/app/admin-nav";
import { DisputeResolveForm } from "@/components/app/admin-forms";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { formatPoints, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "مدیریت اختلافات" };

export default async function AdminDisputesPage() {
  await requireRole("ADMIN");

  const disputes = await prisma.dispute.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: {
      report: { select: { id: true, title: true, status: true } },
      openedBy: { select: { name: true, username: true } },
    },
  });

  const open = disputes.filter((d) => d.status === "OPEN");
  const resolved = disputes.filter((d) => d.status !== "OPEN");

  return (
    <DashboardShell
      title="اختلافات"
      subtitle={`${formatPoints(open.length)} باز · ${formatPoints(resolved.length)} حل‌شده`}
      nav={ADMIN_NAV}
      currentPath="/admin/disputes"
    >
      {disputes.length === 0 ? (
        <EmptyState title="اختلافی وجود ندارد" description="اختلاف‌هایی که پژوهشگران مطرح می‌کنند اینجا نمایش داده می‌شوند." />
      ) : (
        <div className="space-y-6">
          {open.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">اختلافات باز</h2>
              {open.map((d) => (
                <div key={d.id} className="rounded-lg border bg-card p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{d.report.title}</p>
                      <p className="text-xs text-muted-foreground">
                        مطرح‌شده توسط @{d.openedBy.username} · {timeAgo(d.createdAt)}
                      </p>
                    </div>
                    <a href={`/admin/reports/${d.reportId}`} className="text-xs text-primary hover:underline">
                      مشاهده گزارش ←
                    </a>
                  </div>
                  <p className="mb-4 whitespace-pre-wrap rounded-md bg-secondary/40 p-3 text-sm">{d.reason}</p>
                  <DisputeResolveForm disputeId={d.id} />
                </div>
              ))}
            </section>
          ) : null}

          {resolved.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">حل‌شده</h2>
              {resolved.map((d) => (
                <div key={d.id} className="rounded-lg border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{d.report.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{d.resolution}</p>
                    </div>
                    <StatusBadge status={d.status.startsWith("RESOLVED") ? "RESOLVED" : d.report.status} />
                  </div>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      )}
    </DashboardShell>
  );
}
