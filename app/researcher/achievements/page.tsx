import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { RESEARCHER_NAV } from "@/components/app/researcher-nav";
import { ACHIEVEMENTS } from "@/lib/constants";
import { researcherLevel } from "@/lib/gamification";
import { formatPoints, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "نشان‌ها" };

export default async function AchievementsPage() {
  const user = await requireUser();
  const [achievements, agg] = await Promise.all([
    prisma.userAchievement.findMany({ where: { userId: user.id }, orderBy: { awardedAt: "desc" } }),
    prisma.report.aggregate({
      where: { researcherId: user.id, status: { in: ["ACCEPTED", "RESOLVED", "REWARDED"] } },
      _sum: { points: true },
    }),
  ]);
  const owned = new Map(achievements.map((a) => [a.key, a.awardedAt]));
  const level = researcherLevel(agg._sum.points ?? 0);

  return (
    <DashboardShell title="نشان‌ها" subtitle={`${formatPoints(owned.size)} از ${ACHIEVEMENTS.length} نشان باز شده · ${level.name}`} nav={RESEARCHER_NAV} currentPath="/researcher/achievements">
      <div className="grid gap-3 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const awardedAt = owned.get(a.key);
          return (
            <div
              key={a.key}
              className={`flex items-center gap-3 rounded-lg border p-4 ${
                awardedAt ? "border-primary/30 bg-primary/5" : "border-dashed opacity-50"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base ${
                  awardedAt ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {awardedAt ? "★" : "☆"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {awardedAt ? `باز شده ${timeAgo(awardedAt)}` : a.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
