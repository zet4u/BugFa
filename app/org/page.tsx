import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ORG_NAV } from "@/components/app/org-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import { ShieldCheck, AlertCircle, Coins } from "lucide-react";
import { formatMoney, formatPoints, timeAgo } from "@/lib/utils";
import { PROGRAM_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "نمای کلی سازمان" };

export default async function OrgDashboard() {
  const user = await requireUser();
  const orgs = await prisma.organization.findMany({
    where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    include: {
      programs: { select: { id: true, status: true, title: true, slug: true } },
      teamInvites: { where: { acceptedAt: null } },
    },
  });

  if (orgs.length === 0) {
    return (
      <DashboardShell title="سازمان" nav={ORG_NAV} currentPath="/org">
        <EmptyState
          icon={<AlertCircle />}
          title="سازمانی یافت نشد"
          description="حساب شما باید هنگام ثبت‌نام سازمانی ساخته باشد. اگر فکر می‌کنید اشتباهی رخ داده با پشتیبانی تماس بگیرید."
        />
      </DashboardShell>
    );
  }

  const org = orgs[0];
  const programIds = org.programs.map((p) => p.id);
  const [stats, pendingReports, recent] = await Promise.all([
    prisma.report.groupBy({
      by: ["status"],
      where: { programId: { in: programIds } },
      _count: true,
    }),
    prisma.report.findMany({
      where: { programId: { in: programIds }, status: "NEW" },
      select: { id: true, title: true, severity: true, submittedAt: true, program: { select: { title: true } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    prisma.report.findMany({
      where: { programId: { in: programIds }, status: "REWARDED" },
      select: { rewardAmount: true },
    }),
  ]);
  const sumRewarded = recent.reduce((s, r) => s + (r.rewardAmount ?? 0), 0);
  const byStatus = Object.fromEntries(stats.map((s) => [s.status, s._count]));
  const newCount = byStatus.NEW ?? 0;

  return (
    <DashboardShell
      title={org.name}
      subtitle={`سازمان ${org.verified ? "· تاییدشده" : "· تاییدنشده"}`}
      nav={ORG_NAV}
      currentPath="/org"
      header={
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/org/programs/new">ساخت برنامه</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/org/reports?status=NEW">
              صف بررسی {newCount > 0 ? `(${formatPoints(newCount)})` : ""}
            </Link>
          </Button>
        </div>
      }
    >
      {!org.verified ? (
        <div className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <ShieldCheck className="me-2 inline h-4 w-4" />
          سازمان شما هنوز تایید نشده است. سازمان‌های تاییدشده نشان تایید و اعتماد بیشتر پژوهشگران را کسب می‌کنند.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "برنامه‌ها", value: formatPoints(org.programs.length) },
          { label: "گزارش‌های جدید", value: formatPoints(newCount) },
          { label: "جایزه‌های پرداخت‌شده", value: formatMoney(sumRewarded) },
          { label: "دعوت‌های تیم", value: formatPoints(org.teamInvites.length) },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">برنامه‌های شما</h2>
        {org.programs.length === 0 ? (
          <EmptyState
            title="هنوز برنامه‌ای ندارید"
            description="اولین برنامه خود را بسازید تا شروع به دریافت گزارش آسیب‌پذیری کنید."
            action={
              <Button asChild size="sm">
                <Link href="/org/programs/new">ساخت برنامه</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {org.programs.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <Link href={`/programs/${p.slug}`} className="text-xs text-muted-foreground hover:text-primary">
                    /programs/{p.slug}
                  </Link>
                </div>
                <Badge variant="secondary">{PROGRAM_STATUS_LABELS[p.status] ?? p.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {pendingReports.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">جدیدترین گزارش‌ها</h2>
          <div className="space-y-2">
            {pendingReports.map((r) => (
              <Link
                key={r.id}
                href={`/org/reports/${r.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.program.title} · {timeAgo(r.submittedAt)}
                  </p>
                </div>
                <Coins className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </DashboardShell>
  );
}
