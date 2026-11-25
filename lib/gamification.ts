import "server-only";
import { prisma } from "@/lib/prisma";
import { POINTS, ACHIEVEMENTS } from "@/lib/constants";
import { notify } from "@/lib/notifications";

export async function awardPointsAndAchievements(reportId: string, userId: string, severity: keyof typeof POINTS) {
  const points = POINTS[severity] ?? 0;
  await prisma.report.update({ where: { id: reportId }, data: { points } });
  await checkAchievements(userId);
  return points;
}

export async function checkAchievements(userId: string) {
  const reports = await prisma.report.findMany({
    where: { researcherId: userId, status: { in: ["ACCEPTED", "RESOLVED", "REWARDED"] } },
    select: {
      programId: true,
      severity: true,
      status: true,
      program: { select: { organizationId: true } },
    },
  });

  const stats = {
    accepted: reports.length,
    rewarded: reports.filter((r) => r.status === "REWARDED").length,
    critical: reports.filter((r) => r.severity === "CRITICAL").length,
    high: reports.filter((r) => r.severity === "HIGH").length,
    total: await prisma.report.count({ where: { researcherId: userId } }),
    programs: new Set(reports.map((r) => r.programId)).size,
    firstBlood: 0,
  };

  if (reports.length > 0) {
    const firstAccepted = reports.reduce(
      (min, r) => (min.programId === r.programId ? min : min),
      reports[0]
    );
    const earliest = await prisma.report.findFirst({
      where: { programId: firstAccepted.programId, status: { in: ["ACCEPTED", "RESOLVED", "REWARDED"] } },
      orderBy: { submittedAt: "asc" },
      select: { researcherId: true },
    });
    if (earliest?.researcherId === userId) stats.firstBlood = 1;
  }

  const existing = await prisma.userAchievement.findMany({
    where: { userId },
    select: { key: true },
  });
  const owned = new Set(existing.map((a) => a.key));

  for (const def of ACHIEVEMENTS) {
    if (owned.has(def.key)) continue;
    if (def.check(stats)) {
      await prisma.userAchievement.create({ data: { userId, key: def.key } });
      await notify({
        userId,
        type: "ACHIEVEMENT",
        title: `نشان جدید: ${def.title}`,
        body: def.description,
        link: "/researcher/achievements",
      });
    }
  }
}

export function researcherLevel(points: number) {
  if (points >= 2000) return { name: "شکارچی نخبه", min: 2000, next: null };
  if (points >= 1000) return { name: "شکارچی استاد", min: 1000, next: 2000 };
  if (points >= 500) return { name: "شکارچی ارشد", min: 500, next: 1000 };
  if (points >= 200) return { name: "شکارچی", min: 200, next: 500 };
  if (points >= 50) return { name: "کاوشگر", min: 50, next: 200 };
  return { name: "تازه‌کار", min: 0, next: 50 };
}
