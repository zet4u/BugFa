import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { SeverityBadge } from "@/components/app/severity-badge";
import { EmptyState } from "@/components/app/empty-state";
import { researcherLevel } from "@/lib/gamification";
import { ACHIEVEMENTS } from "@/lib/constants";
import { formatPoints, timeAgo } from "@/lib/utils";
import { Globe, MapPin, Github, Twitter } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username }, select: { name: true } });
  return { title: user ? `${user.name} · نمایه پژوهشگر` : "پژوهشگر یافت نشد" };
}

export default async function ResearcherProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      country: true,
      website: true,
      github: true,
      twitter: true,
      avatarUrl: true,
      role: true,
      forbidden: true,
      createdAt: true,
      achievements: { select: { key: true, awardedAt: true } },
    },
  });
  if (!user || user.forbidden || user.role !== "RESEARCHER") notFound();

  const reports = await prisma.report.findMany({
    where: { researcherId: user.id, status: { in: ["ACCEPTED", "RESOLVED", "REWARDED"] } },
    orderBy: { submittedAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      severity: true,
      status: true,
      submittedAt: true,
      program: { select: { title: true, slug: true } },
    },
  });

  const severityBreakdown = await prisma.report.groupBy({
    by: ["severity"],
    where: { researcherId: user.id, status: { in: ["ACCEPTED", "RESOLVED", "REWARDED"] } },
    _count: true,
  });

  const points = await prisma.report.aggregate({
    where: { researcherId: user.id, status: { in: ["ACCEPTED", "RESOLVED", "REWARDED"] } },
    _sum: { points: true },
  });
  const totalPoints = points._sum.points ?? 0;
  const level = researcherLevel(totalPoints);
  const ownedAchievements = new Set(user.achievements.map((a) => a.key));

  return (
    <div className="container-app max-w-4xl animate-fade-up py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-primary">{level.name}</span>
            {user.country ? (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {user.country}</span>
            ) : null}
            <span>عضو از {timeAgo(user.createdAt)}</span>
          </p>
        </div>
        <div className="flex gap-3">
          {user.website ? (
            <a href={user.website} target="_blank" rel="noopener noreferrer nofollow" aria-label="وب‌سایت">
              <Globe className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </a>
          ) : null}
          {user.github ? (
            <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer nofollow" aria-label="گیت‌هاب">
              <Github className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </a>
          ) : null}
          {user.twitter ? (
            <a href={`https://x.com/${user.twitter}`} target="_blank" rel="noopener noreferrer nofollow" aria-label="ایکس">
              <Twitter className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </a>
          ) : null}
        </div>
      </div>

      {user.bio ? <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{user.bio}</p> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">امتیاز اعتبار</p>
          <p className="mt-1 font-mono text-xl font-bold text-primary">{formatPoints(totalPoints)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">گزارش‌های پذیرفته‌شده</p>
          <p className="mt-1 font-mono text-xl font-bold">{severityBreakdown.reduce((s, b) => s + b._count, 0)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">نشان‌ها</p>
          <p className="mt-1 font-mono text-xl font-bold">
            {ownedAchievements.size}/{ACHIEVEMENTS.length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-1 text-xs text-muted-foreground">ترکیب شدت</p>
          <div className="flex flex-wrap gap-1">
            {severityBreakdown.map((b) => (
              <SeverityBadge key={b.severity} severity={b.severity} />
            ))}
            {severityBreakdown.length === 0 ? <span className="text-sm text-muted-foreground">—</span> : null}
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">نشان‌ها</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACHIEVEMENTS.map((achievement) => {
            const owned = ownedAchievements.has(achievement.key);
            return (
              <div
                key={achievement.key}
                className={`flex items-center gap-3 rounded-lg border p-3 ${owned ? "border-primary/30 bg-primary/5" : "opacity-40"}`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    owned ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {owned ? "★" : "☆"}
                </div>
                <div>
                  <p className="text-sm font-medium">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">تازه‌ترین گزارش‌های پذیرفته‌شده</h2>
        {reports.length === 0 ? (
          <EmptyState title="هنوز گزارش پذیرفته‌شده‌ای وجود ندارد" />
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/programs/${report.program.slug}`}
                className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{report.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{report.program.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SeverityBadge severity={report.severity} />
                  <span className="hidden text-xs text-muted-foreground sm:inline">{timeAgo(report.submittedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          جزئیات گزارش‌ها بین پژوهشگر و برنامه محرمانه باقی می‌ماند.
        </p>
      </section>
    </div>
  );
}
