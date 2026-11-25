import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { formatPoints, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "اعلان‌ها" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return (
    <div className="container-app max-w-3xl animate-fade-up py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">اعلان‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatPoints(unreadCount)} خوانده‌نشده</p>
        </div>
        {unreadCount > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">
              <CheckCheck className="ms-1 h-4 w-4" /> علامت‌گذاری همه به‌عنوان خوانده‌شده
            </Button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card/50 px-6 py-16 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">هنوز اعلانی وجود ندارد.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-lg border bg-card px-4 py-3 ${
                n.read ? "opacity-60" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body ? <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {n.link && !n.read ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <Button asChild variant="ghost" size="sm">
                      <div>
                        <Link href={n.link} className="text-primary hover:underline">
                          باز کردن
                        </Link>
                      </div>
                    </Button>
                  </form>
                ) : n.link ? (
                  <Link href={n.link} className="text-xs text-primary hover:underline">
                    باز کردن
                  </Link>
                ) : null}
                {!n.read ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      خواندم
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
