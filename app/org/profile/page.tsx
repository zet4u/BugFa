import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ORG_NAV } from "@/components/app/org-nav";
import { OrgProfileForm } from "@/components/app/org-forms";
import { EmptyState } from "@/components/app/empty-state";
import { formatPoints } from "@/lib/utils";

export const metadata: Metadata = { title: "نمایه سازمان" };

export default async function OrgProfilePage() {
  const user = await requireRole("ORGANIZATION", "ADMIN");
  const org = await prisma.organization.findFirst({
    where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    include: { owner: { select: { name: true, email: true } }, _count: { select: { programs: true, members: true } } },
  });

  if (!org) {
    return (
      <DashboardShell title="نمایه سازمان" nav={ORG_NAV} currentPath="/org/profile">
        <EmptyState title="سازمانی یافت نشد" description="اگر این درست به نظر نمی‌رسد با پشتیبانی تماس بگیرید." />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="نمایه سازمان"
      nav={ORG_NAV}
      currentPath="/org/profile"
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">برنامه‌ها</p>
          <p className="mt-1 text-xl font-bold">{formatPoints(org._count.programs)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">اعضای تیم</p>
          <p className="mt-1 text-xl font-bold">{formatPoints(org._count.members + 1)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">وضعیت</p>
          <p className="mt-1 text-xl font-bold">{org.verified ? "تاییدشده" : "تاییدنشده"}</p>
        </div>
      </div>

      {org.ownerId === user.id ? (
        <OrgProfileForm
          org={{
            name: org.name,
            description: org.description ?? "",
            website: org.website ?? "",
            twitter: org.twitter ?? "",
          }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          فقط مالک سازمان ({org.owner.name}) می‌تواند نمایه را ویرایش کند.
        </p>
      )}
    </DashboardShell>
  );
}
