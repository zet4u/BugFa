import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import { formatPoints } from "@/lib/utils";
import { Trophy, Medal } from "lucide-react";

export const metadata: Metadata = { title: "جدول امتیازات" };

export default async function LeaderboardPage() {
  const researchers = await prisma.user.findMany({
    where: { role: "RESEARCHER", forbidden: false },
    select: {
      id: true,
      username: true,
      name: true,
      country: true,
      avatarUrl: true,
      reports: {
        where: { status: { in: ["ACCEPTED", "RESOLVED", "REWARDED"] } },
        select: { points: true, severity: true },
      },
    },
  });

  const ranked = researchers
    .map((r) => ({
      ...r,
      points: r.reports.reduce((sum, report) => sum + report.points, 0),
      accepted: r.reports.length,
      critical: r.reports.filter((report) => report.severity === "CRITICAL").length,
    }))
    .sort((a, b) => b.points - a.points || b.accepted - a.accepted)
    .slice(0, 50);

  return (
    <div className="container-app max-w-4xl py-10">
      <h1 className="animate-fade-up text-2xl font-bold tracking-tight">جدول امتیازات پژوهشگران</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        رتبه‌بندی بر اساس امتیاز اعتبارِ گزارش‌های پذیرفته‌شده. به‌صورت زنده به‌روزرسانی می‌شود.
      </p>

      {ranked.length === 0 ? (
        <EmptyState icon={<Trophy />} title="هنوز پژوهشگری رتبه‌بندی نشده است" />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-right font-medium">#</th>
                <th className="px-4 py-3 text-right font-medium">پژوهشگر</th>
                <th className="px-4 py-3 text-right font-medium">امتیاز</th>
                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">پذیرفته‌شده</th>
                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">بحرانی</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {i < 3 ? (
                      <Medal
                        className={`h-4 w-4 ${i === 0 ? "text-primary" : i === 1 ? "text-zinc-300" : "text-amber-600"}`}
                      />
                    ) : (
                      i + 1
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/researchers/${r.username}`} className="flex items-center gap-3 hover:text-primary">
                      <Avatar className="h-7 w-7">
                        {r.avatarUrl ? <Image src={r.avatarUrl} alt="" width={28} height={28} /> : null}
                        <AvatarFallback className="text-[10px]">
                          {r.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        <span className="font-medium">{r.name}</span>
                        {r.country ? (
                          <span className="me-2 text-xs text-muted-foreground">{r.country}</span>
                        ) : null}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-primary">
                    {formatPoints(r.points)}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell">{r.accepted}</td>
                  <td className="hidden px-4 py-3 text-right sm:table-cell">
                    {r.critical > 0 ? <Badge variant="secondary">{r.critical}</Badge> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
