import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/app/empty-state";
import { researcherLevel } from "@/lib/gamification";
import { Award } from "lucide-react";

export const metadata: Metadata = { title: "Hall of Fame" };

export default async function HallOfFamePage() {
  const researchers = await prisma.user.findMany({
    where: { role: "RESEARCHER", forbidden: false },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      reports: {
        where: { status: { in: ["ACCEPTED", "RESOLVED", "REWARDED"] } },
        select: { points: true },
      },
    },
  });

  const inducted = researchers
    .map((r) => ({
      ...r,
      points: r.reports.reduce((sum, report) => sum + report.points, 0),
    }))
    .filter((r) => r.points >= 100)
    .sort((a, b) => b.points - a.points);

  return (
    <div className="container-app max-w-5xl py-10">
      <h1 className="text-2xl font-bold tracking-tight">Hall of Fame</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Researchers with at least 100 reputation points from accepted findings.
      </p>
      {inducted.length === 0 ? (
        <EmptyState icon={<Award />} title="No inducted researchers yet" description="The first 100 points gets you in." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inducted.map((r) => {
            const level = researcherLevel(r.points);
            return (
              <Link
                key={r.id}
                href={`/researchers/${r.username}`}
                className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{r.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium hover:text-primary">{r.name}</p>
                  <p className="text-xs text-primary">{level.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.bio}</p>
                  <p className="mt-2 font-mono text-sm font-semibold text-primary">{r.points} pts</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
