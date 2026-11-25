import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV } from "@/components/app/admin-nav";
import { formatPoints, timeAgo } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "نمای کلی پلتفرم" };

export default async function AdminOverviewPage() {
  await requireRole("ADMIN");

  const [
    totalUsers,
    totalResearchers,
    totalOrgUsers,
    totalOrgs,
    verifiedOrgs,
    totalPrograms,
    publicPrograms,
    totalReports,
    openDisputes,
    recentAudits,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "RESEARCHER" } }),
    prisma.user.count({ where: { role: "ORGANIZATION" } }),
    prisma.organization.count(),
    prisma.organization.count({ where: { verified: true } }),
    prisma.program.count(),
    prisma.program.count({ where: { status: "PUBLIC" } }),
    prisma.report.count(),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { name: true } } } }),
  ]);

  const reportStatus = await prisma.report.groupBy({ by: ["status"], _count: true });
  const byStatus = Object.fromEntries(reportStatus.map((r) => [r.status, r._count]));

  const stats = [
    { label: "کاربران", value: totalUsers },
    { label: "پژوهشگران", value: totalResearchers },
    { label: "حساب‌های سازمانی", value: totalOrgUsers },
    { label: "سازمان‌ها", value: `${formatPoints(verifiedOrgs)}/${formatPoints(totalOrgs)} تاییدشده` },
    { label: "برنامه‌ها", value: `${formatPoints(publicPrograms)}/${formatPoints(totalPrograms)} عمومی` },
    { label: "گزارش‌ها", value: totalReports },
    { label: "جایزه‌داده‌شده", value: byStatus.REWARDED ?? 0 },
    { label: "اختلافات باز", value: openDisputes },
  ];

  return (
    <DashboardShell title="نمای کلی پلتفرم" nav={ADMIN_NAV} currentPath="/admin">
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-medium">خط لوله گزارش‌ها</p>
          </div>
          <ul className="divide-y divide-border">
            {["NEW", "TRIAGED", "ACCEPTED", "REJECTED", "DUPLICATE", "RESOLVED", "REWARDED"].map((s) => (
              <li key={s} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <Link href={`/admin/reports?status=${s}`} className="text-muted-foreground hover:text-primary">
                  {STATUS_LABELS[s] ?? s}
                </Link>
                <span className="font-medium">{byStatus[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-medium">فعالیت اخیر حسابرسی</p>
          </div>
          {recentAudits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">هنوز رخداد حسابرسی ثبت نشده است.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentAudits.map((a) => (
                <li key={a.id} className="px-4 py-2.5 text-sm">
                  <span className="font-mono text-xs text-primary">{a.action}</span>
                  <span className="text-muted-foreground"> · {a.actor?.name ?? "سیستم"} · {timeAgo(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t px-4 py-2.5">
            <Link href="/admin/audit-logs" className="text-xs text-muted-foreground hover:text-primary">
              مشاهده همه لاگ‌های حسابرسی ←
            </Link>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
