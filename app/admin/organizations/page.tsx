import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV } from "@/components/app/admin-nav";
import { OrgVerifyForm } from "@/components/app/admin-forms";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import { formatPoints, timeAgo } from "@/lib/utils";
import { ShieldCheck, ShieldOff } from "lucide-react";

export const metadata: Metadata = { title: "تایید سازمان‌ها" };

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const filter = params.filter === "VERIFIED" || params.filter === "UNVERIFIED" ? params.filter : "ALL";

  const orgs = await prisma.organization.findMany({
    where: filter === "VERIFIED" ? { verified: true } : filter === "UNVERIFIED" ? { verified: false } : {},
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { programs: true, members: true } },
    },
  });

  return (
    <DashboardShell title="سازمان‌ها" subtitle={`${formatPoints(orgs.length)} سازمان`} nav={ADMIN_NAV} currentPath="/admin/organizations">
      <div className="mb-4 flex gap-1">
        {[
          { value: "ALL", label: "همه", href: "/admin/organizations" },
          { value: "UNVERIFIED", label: "تاییدنشده", href: "/admin/organizations?filter=UNVERIFIED" },
          { value: "VERIFIED", label: "تاییدشده", href: "/admin/organizations?filter=VERIFIED" },
        ].map((t) => (
          <a
            key={t.value}
            href={t.href}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              filter === t.value ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {orgs.length === 0 ? (
        <EmptyState icon={filter === "UNVERIFIED" ? <ShieldOff /> : <ShieldCheck />} title="سازمانی یافت نشد" />
      ) : (
        <div className="space-y-3">
          {orgs.map((o) => (
            <div key={o.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{o.name}</p>
                  {o.verified ? (
                    <Badge variant="default" className="gap-1"><ShieldCheck className="h-3 w-3" /> تاییدشده</Badge>
                  ) : (
                    <Badge variant="secondary">تاییدنشده</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  مالک: {o.owner.name} ({o.owner.email}) · {formatPoints(o._count.programs)} برنامه · {formatPoints(o._count.members + 1)} عضو · ساخته‌شده {timeAgo(o.createdAt)}
                </p>
              </div>
              <OrgVerifyForm organizationId={o.id} verified={o.verified} />
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
