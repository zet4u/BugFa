import Link from "next/link";
import { Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { markAllNotificationsReadAction } from "@/lib/actions/admin";

export async function NotificationBell() {
  const session = await getSession();
  if (!session) return null;

  const [unreadCount, latest] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="group relative">
      <Link
        href="/dashboard/notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label={`اعلان‌ها (${unreadCount} خوانده‌نشده)`}
      >
        <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
        {unreadCount > 0 ? (
          <span className="absolute left-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Link>
      <div className="invisible absolute left-0 top-full z-50 hidden w-80 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
        <div className="rounded-md border bg-popover p-2 shadow-md">
          <div className="mb-1 flex items-center justify-between px-2 pb-1">
            <span className="text-xs font-semibold text-muted-foreground">
              اعلان‌ها
            </span>
            <form action={markAllNotificationsReadAction}>
              <button type="submit" className="text-xs text-primary hover:underline">
                علامت‌گذاری همه به‌عنوان خوانده‌شده
              </button>
            </form>
          </div>
          {latest.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">هنوز اعلانی نیست</p>
          ) : (
            latest.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "/dashboard/notifications"}
                className={`block rounded-md px-2 py-2 transition-colors hover:bg-secondary ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <p className="truncate text-sm font-medium">{n.title}</p>
                {n.body ? <p className="truncate text-xs text-muted-foreground">{n.body}</p> : null}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
