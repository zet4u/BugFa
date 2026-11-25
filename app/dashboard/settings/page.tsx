import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { RESEARCHER_NAV } from "@/components/app/researcher-nav";
import { ProfileForm, ChangePasswordForm, ResendVerification } from "@/components/app/settings-forms";
import { signOutAction } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "تنظیمات نمایه" };

export default async function SettingsPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      name: true,
      username: true,
      bio: true,
      country: true,
      website: true,
      github: true,
      twitter: true,
      email: true,
      emailVerified: true,
      role: true,
    },
  });

  return (
    <DashboardShell title="تنظیمات نمایه" nav={RESEARCHER_NAV} currentPath="/dashboard/settings">
      <div className="max-w-2xl space-y-10 [>*]:animate-fade-up [&>*:nth-child(2)]:[animation-delay:60ms] [&>*:nth-child(3)]:[animation-delay:120ms] [&>*:nth-child(4)]:[animation-delay:180ms]">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">حساب کاربری</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              وارد شده با <span className="font-mono">{dbUser.email}</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary">{ROLE_LABELS[dbUser.role] ?? dbUser.role}</Badge>
              {dbUser.emailVerified ? (
                <Badge variant="secondary" className="text-emerald-400">ایمیل تاییدشده</Badge>
              ) : (
                <Badge variant="secondary" className="text-amber-400">ایمیل تاییدنشده</Badge>
              )}
            </div>
          </div>
          {!dbUser.emailVerified ? <ResendVerification /> : null}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">نمایه</h2>
          <ProfileForm
            defaults={{
              name: dbUser.name,
              username: dbUser.username,
              bio: dbUser.bio ?? "",
              country: dbUser.country ?? "",
              website: dbUser.website ?? "",
              github: dbUser.github ?? "",
              twitter: dbUser.twitter ?? "",
            }}
          />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">رمز عبور</h2>
          <ChangePasswordForm />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">نشست</h2>
          <form action={signOutAction}>
            <Button type="submit" variant="destructive" size="sm">
              خروج از این مرورگر
            </Button>
          </form>
        </section>
      </div>
    </DashboardShell>
  );
}
