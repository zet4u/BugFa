import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ORG_NAV } from "@/components/app/org-nav";
import { OrgProfileForm } from "@/components/app/org-forms";
import { EmptyState } from "@/components/app/empty-state";

export const metadata: Metadata = { title: "Organization profile" };

export default async function OrgProfilePage() {
  const user = await requireRole("ORGANIZATION", "ADMIN");
  const org = await prisma.organization.findFirst({
    where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    include: { owner: { select: { name: true, email: true } }, _count: { select: { programs: true, members: true } } },
  });

  if (!org) {
    return (
      <DashboardShell title="Organization profile" nav={ORG_NAV} currentPath="/org/profile">
        <EmptyState title="No organization found" description="Contact support if this seems wrong." />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Organization profile"
      nav={ORG_NAV}
      currentPath="/org/profile"
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Programs</p>
          <p className="mt-1 text-xl font-bold">{org._count.programs}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Team members</p>
          <p className="mt-1 text-xl font-bold">{org._count.members + 1}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
          <p className="mt-1 text-xl font-bold">{org.verified ? "Verified" : "Unverified"}</p>
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
          Only the organization owner ({org.owner.name}) can edit the profile.
        </p>
      )}
    </DashboardShell>
  );
}
