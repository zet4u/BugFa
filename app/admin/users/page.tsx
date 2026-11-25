import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV } from "@/components/app/admin-nav";
import { Pagination } from "@/components/app/pagination";
import { SimpleSearchInput, UserBanForm, UserRoleForm } from "@/components/app/admin-forms";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "User management" };

function roleVariant(role: string) {
  return role === "ADMIN" ? "default" : "secondary";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
          { username: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
      select: {
        id: true, name: true, email: true, username: true, role: true,
        forbidden: true, emailVerified: true, createdAt: true,
      },
    }),
  ]);
  const totalPages = Math.ceil(total / 20);

  return (
    <DashboardShell title="User management" subtitle={`${total} account${total === 1 ? "" : "s"}`} nav={ADMIN_NAV} currentPath="/admin/users">
      <div className="mb-4">
        <SimpleSearchInput basePath="/admin/users" placeholder="Search by email, name or username…" />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">User</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Joined</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email} · @{u.username}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={roleVariant(u.role)}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className={u.forbidden ? "text-destructive" : u.emailVerified ? "text-muted-foreground" : "text-amber-400"}>
                    {u.forbidden ? "Banned" : u.emailVerified ? "Active" : "Unverified email"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <UserRoleForm userId={u.id} role={u.role} />
                    <UserBanForm userId={u.id} forbidden={u.forbidden} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} basePath="/admin/users" searchParams={params} />
    </DashboardShell>
  );
}
