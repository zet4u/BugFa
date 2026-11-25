import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV } from "@/components/app/admin-nav";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin overview" };

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
    { label: "Users", value: totalUsers },
    { label: "Researchers", value: totalResearchers },
    { label: "Org accounts", value: totalOrgUsers },
    { label: "Organizations", value: `${verifiedOrgs}/${totalOrgs} verified` },
    { label: "Programs", value: `${publicPrograms}/${totalPrograms} public` },
    { label: "Reports", value: totalReports },
    { label: "Rewarded", value: byStatus.REWARDED ?? 0 },
    { label: "Open disputes", value: openDisputes },
  ];

  return (
    <DashboardShell title="Platform overview" nav={ADMIN_NAV} currentPath="/admin">
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-medium">Report pipeline</p>
          </div>
          <ul className="divide-y divide-border">
            {["NEW", "TRIAGED", "ACCEPTED", "REJECTED", "DUPLICATE", "RESOLVED", "REWARDED"].map((s) => (
              <li key={s} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <Link href={`/admin/reports?status=${s}`} className="text-muted-foreground hover:text-primary">
                  {s}
                </Link>
                <span className="font-medium">{byStatus[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-medium">Recent audit activity</p>
          </div>
          {recentAudits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No audit events yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentAudits.map((a) => (
                <li key={a.id} className="px-4 py-2.5 text-sm">
                  <span className="font-mono text-xs text-primary">{a.action}</span>
                  <span className="text-muted-foreground"> · {a.actor?.name ?? "system"} · {timeAgo(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t px-4 py-2.5">
            <Link href="/admin/audit-logs" className="text-xs text-muted-foreground hover:text-primary">
              View all audit logs →
            </Link>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
