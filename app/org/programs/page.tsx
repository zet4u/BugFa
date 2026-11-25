import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ORG_NAV } from "@/components/app/org-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import { setProgramStatusAction } from "@/lib/actions/programs";
import { PROGRAM_STATUS_LABELS } from "@/lib/constants";
import { formatMoney, formatPoints } from "@/lib/utils";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "مدیریت برنامه‌ها" };

export default async function OrgProgramsPage() {
  const user = await requireRole("ORGANIZATION", "ADMIN");
  const programs = await prisma.program.findMany({
    where: {
      organization: {
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      minBounty: true,
      maxBounty: true,
      currency: true,
      _count: { select: { reports: true } },
    },
  });

  return (
    <DashboardShell
      title="مدیریت برنامه‌ها"
      nav={ORG_NAV}
      currentPath="/org/programs"
      header={
        <Button asChild size="sm">
          <Link href="/org/programs/new">
            <Plus className="me-1.5 h-4 w-4" /> برنامه جدید
          </Link>
        </Button>
      }
    >
      {programs.length === 0 ? (
        <EmptyState
          title="هنوز برنامه‌ای ندارید"
          description="اولین برنامه باگ بانتی خود را بسازید تا شروع به دریافت گزارش کنید."
          action={
            <Button asChild size="sm">
              <Link href="/org/programs/new">ساخت برنامه</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/org/programs/${p.id}/edit`}
                    className="truncate font-medium hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  <Badge variant={p.status === "PUBLIC" ? "default" : "secondary"}>
                    {PROGRAM_STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatMoney(p.minBounty, p.currency)} – {formatMoney(p.maxBounty, p.currency)} ·{" "}
                  {formatPoints(p._count.reports)} گزارش ·{" "}
                  <Link href={`/programs/${p.slug}`} className="hover:text-primary">
                    مشاهده صفحه عمومی
                  </Link>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(["PUBLIC", "PRIVATE", "PAUSED", "DRAFT"] as const)
                  .filter((s) => s !== p.status)
                  .map((s) => (
                    <form key={s} action={setProgramStatusAction}>
                      <input type="hidden" name="programId" value={p.id} />
                      <input type="hidden" name="status" value={s} />
                      <Button type="submit" variant="outline" size="sm">
                        {PROGRAM_STATUS_LABELS[s]}
                      </Button>
                    </form>
                  ))}
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/org/programs/${p.id}/edit`}>ویرایش</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
