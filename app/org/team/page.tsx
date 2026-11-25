import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ORG_NAV } from "@/components/app/org-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import { InviteMemberForm, PendingInviteForm } from "@/components/app/org-forms";
import { removeTeamMemberAction } from "@/lib/actions/org";
import { formatPoints, timeAgo } from "@/lib/utils";
import { TEAM_ROLE_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "تیم" };

export default async function OrgTeamPage() {
  const user = await requireRole("ORGANIZATION", "ADMIN");
  const org = await prisma.organization.findFirst({
    where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, username: true } } },
        orderBy: { createdAt: "desc" },
      },
      teamInvites: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!org) {
    return (
      <DashboardShell title="تیم" nav={ORG_NAV} currentPath="/org/team">
        <EmptyState title="سازمانی یافت نشد" />
      </DashboardShell>
    );
  }

  const isOwner = org.ownerId === user.id;
  const myInvites = org.teamInvites.filter(
    (i) => !i.acceptedAt && i.email.toLowerCase() === user.email.toLowerCase()
  );

  return (
    <DashboardShell title="تیم" nav={ORG_NAV} currentPath="/org/team">
      {myInvites.length > 0 ? (
        <div className="mb-6 rounded-lg border border-primary/40 bg-primary/5 p-4">
          <p className="mb-3 text-sm font-medium">
            شما {formatPoints(myInvites.length)} دعوت‌نامه معلق به این سازمان دارید.
          </p>
          <div className="flex flex-wrap gap-3">
            {myInvites.map((i) => (
              <PendingInviteForm key={i.id} token={i.token} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">اعضا</p>
        </div>
        <ul className="divide-y divide-border">
          <li className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{org.owner.name}</p>
              <p className="text-xs text-muted-foreground">{org.owner.email}</p>
            </div>
            <Badge variant="secondary">مالک</Badge>
          </li>
          {org.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{m.user.name}</p>
                <p className="text-xs text-muted-foreground">{m.user.email}</p>
                <p className="text-xs text-muted-foreground">عضو از {timeAgo(m.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{TEAM_ROLE_LABELS[m.role] ?? m.role}</Badge>
                {isOwner ? (
                  <form action={removeTeamMemberAction}>
                    <input type="hidden" name="memberId" value={m.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                      Remove
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">
            دعوت‌نامه‌های معلق
          </p>
        </div>
        {org.teamInvites.filter((i) => !i.acceptedAt).length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">دعوت‌نامه معلقی وجود ندارد.</p>
        ) : (
          <ul className="divide-y divide-border">
            {org.teamInvites
              .filter((i) => !i.acceptedAt)
              .map((i) => (
                <li key={i.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm">{i.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {TEAM_ROLE_LABELS[i.role] ?? i.role} · دعوت‌شده {timeAgo(i.createdAt)}
                      
                    </p>
                  </div>
                  <Badge variant="secondary">در انتظار</Badge>
                </li>
              ))}
          </ul>
        )}
      </div>

      {isOwner ? (
        <div className="mt-6">
          <InviteMemberForm />
        </div>
      ) : null}
    </DashboardShell>
  );
}
