import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { RESEARCHER_NAV } from "@/components/app/researcher-nav";
import { StatusBadge } from "@/components/app/status-badge";
import { SeverityBadge } from "@/components/app/severity-badge";
import { EmptyState } from "@/components/app/empty-state";
import { researcherLevel } from "@/lib/gamification";
import { formatMoney, formatPoints, timeAgo } from "@/lib/utils";
import { MailWarning, FileSearch, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Researcher dashboard" };

export default async function ResearcherDashboard() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { emailVerified: true } });

  const [reports, earnings, bookmarkCount, achievementCount] = await Promise.all([
    prisma.report.findMany({
      where: { researcherId: user.id },
      orderBy: { submittedAt: "desc" },
      take: 6,
      select: { id: true, title: true, status: true, severity: true, submittedAt: true, program: { select: { title: true } } },
    }),
    prisma.report.aggregate({
      where: { researcherId: user.id, status: "REWARDED" },
      _sum: { rewardAmount: true },
      _count: true,
    }),
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.userAchievement.count({ where: { userId: user.id } }),
  ]);

  const allReports = await prisma.report.findMany({
    where: { researcherId: user.id },
    select: { status: true, severity: true },
  });
  const accepted = allReports.filter((r) => ["ACCEPTED", "RESOLVED", "REWARDED"].includes(r.status));
  const points = accepted.reduce((sum, r) => {
    const map = { CRITICAL: 100, HIGH: 60, MEDIUM: 30, LOW: 10, INFORMATIONAL: 2 } as Record<string, number>;
    return sum + (map[r.severity] ?? 0);
  }, 0);
  const level = researcherLevel(points);

  const stats = [
    { label: "Reputation points", value: formatPoints(points) },
    { label: "Rank", value: level.name },
    { label: "Total earnings", value: formatMoney(earnings._sum.rewardAmount ?? 0) },
    { label: "Accepted / total", value: `${accepted.length} / ${allReports.length}` },
  ];

  return (
    <DashboardShell title={`Hello, ${user.name}`} subtitle={level.next ? `${formatPoints(level.next - points)} points to the next level` : "Top level reached"} nav={RESEARCHER_NAV} currentPath="/researcher">
      {dbUser && !dbUser.emailVerified ? (
        <div className="mb-6 flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Your email is not verified yet.</p>
            <p className="mt-0.5 text-amber-400/80">
              Check the verification link printed in the server console during development, or resend it from your settings.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Button asChild variant="outline" className="justify-start">
          <Link href="/researcher/programs"><FileSearch className="text-primary" /> Find programs</Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/leaderboard"><Wallet className="text-primary" /> Your leaderboard position</Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/researcher/achievements">{achievementCount} achievements unlocked</Link>
        </Button>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent submissions</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/researcher/submissions">View all</Link>
          </Button>
        </div>
        {reports.length === 0 ? (
          <EmptyState
            icon={<FileSearch />}
            title="No submissions yet"
            description="Pick a program, find a valid bug, and submit your first report."
            action={
              <Button asChild size="sm">
                <Link href="/researcher/programs">Browse programs</Link>
              </Button>
            }
          />
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
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SeverityBadge severity={r.severity} />
                  <StatusBadge status={r.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
