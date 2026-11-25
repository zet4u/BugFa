import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { RESEARCHER_NAV } from "@/components/app/researcher-nav";
import { EmptyState } from "@/components/app/empty-state";
import { SeverityBadge } from "@/components/app/severity-badge";
import { formatMoney, timeAgo } from "@/lib/utils";
import { Wallet } from "lucide-react";

export const metadata: Metadata = { title: "درآمد" };

export default async function EarningsPage() {
  const user = await requireUser();
  const [rewarded, totals, byProgram] = await Promise.all([
    prisma.report.findMany({
      where: { researcherId: user.id, status: "REWARDED" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        severity: true,
        rewardAmount: true,
        currency: true,
        updatedAt: true,
        program: { select: { title: true } },
      },
    }),
    prisma.report.aggregate({
      where: { researcherId: user.id, status: "REWARDED" },
      _sum: { rewardAmount: true },
    }),
    prisma.report.groupBy({
      by: ["programId"],
      where: { researcherId: user.id, status: "REWARDED" },
      _sum: { rewardAmount: true },
    }),
  ]);

  const programIds = byProgram.map((p) => p.programId);
  const programsById = programIds.length
    ? Object.fromEntries(
        (await prisma.program.findMany({ where: { id: { in: programIds } }, select: { id: true, title: true } })).map(
          (p) => [p.id, p.title]
        )
      )
    : {};

  return (
    <DashboardShell title="درآمد و جوایز" subtitle="جایزه‌هایی که تیم برنامه به‌عنوان پرداخت‌شده ثبت کرده است" nav={RESEARCHER_NAV} currentPath="/researcher/earnings">
      <div className="rounded-lg border bg-card p-6">
        <p className="text-xs text-muted-foreground">مجموع پرداخت‌شده</p>
        <p className="mt-1 font-mono text-3xl font-bold text-primary">
          {formatMoney(totals._sum.rewardAmount ?? 0)}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">تاریخچه جوایز</h2>
        {rewarded.length === 0 ? (
          <EmptyState icon={<Wallet />} title="هنوز جایزه‌ای وجود ندارد" description="جایزه‌ها وقتی نمایش داده می‌شوند که تیم برنامه گزارشی را جایزه‌داده‌شده علامت بزند." />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-right font-medium">گزارش</th>
                  <th className="px-4 py-2.5 text-right font-medium">برنامه</th>
                  <th className="px-4 py-2.5 text-right font-medium">شدت</th>
                  <th className="px-4 py-2.5 text-left font-medium">مبلغ</th>
                  <th className="px-4 py-2.5 text-left font-medium">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {rewarded.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="max-w-64 truncate px-4 py-2.5 font-medium">{r.title}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.program.title}</td>
                    <td className="px-4 py-2.5"><SeverityBadge severity={r.severity} /></td>
                    <td className="px-4 py-2.5 text-left font-mono font-semibold text-primary">
                      {formatMoney(r.rewardAmount, r.currency)}
                    </td>
                    <td className="px-4 py-2.5 text-left text-xs text-muted-foreground">{timeAgo(r.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {byProgram.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">به تفکیک برنامه</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {byProgram.map((p) => (
              <div key={p.programId} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <span className="truncate text-sm">{programsById[p.programId]}</span>
                <span className="font-mono text-sm font-semibold text-primary">
                  {formatMoney(p._sum.rewardAmount ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </DashboardShell>
  );
}
