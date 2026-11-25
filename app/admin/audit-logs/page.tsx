import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV } from "@/components/app/admin-nav";
import { Pagination } from "@/components/app/pagination";
import { formatPoints, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "لاگ‌های حسابرسی" };

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 30,
      take: 30,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);
  const totalPages = Math.ceil(total / 30);

  return (
    <DashboardShell title="لاگ‌های حسابرسی" subtitle={`${formatPoints(total)} رخداد`} nav={ADMIN_NAV} currentPath="/admin/audit-logs">
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">هنوز رخدادی در لاگ حسابرسی ثبت نشده است.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-secondary/40 text-right text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">زمان</th>
                <th className="px-4 py-2.5 font-medium">اقدام</th>
                <th className="px-4 py-2.5 font-medium">کاربر</th>
                <th className="px-4 py-2.5 font-medium">هدف</th>
                <th className="px-4 py-2.5 font-medium">فراداده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{timeAgo(l.createdAt)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">{l.action}</td>
                  <td className="px-4 py-3 text-xs">{l.actor ? `${l.actor.name} (${l.actor.email})` : "سیستم"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.targetType}{l.targetId ? ` · ${l.targetId.slice(-8)}` : ""}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {l.metadata ? JSON.stringify(l.metadata).slice(0, 80) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath="/admin/audit-logs" searchParams={params} />
    </DashboardShell>
  );
}
