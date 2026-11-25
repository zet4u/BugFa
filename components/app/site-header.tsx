import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/app/user-nav";
import { NotificationBell } from "@/components/app/notification-bell";
import { MobileNav } from "@/components/app/mobile-nav";

const NAV_LINKS = [
  { href: "/explore", label: "Explore Programs" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
  { href: "/about", label: "About" },
];

export async function SiteHeader() {
  const session = await getSession();
  let user = null;
  if (session) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, role: true, avatarUrl: true, username: true },
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-app flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              <UserNav
                name={user.name}
                email={user.email}
                role={user.role}
                username={user.username}
                avatarUrl={user.avatarUrl}
              />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
          <MobileNav links={NAV_LINKS} signedIn={!!user} />
        </div>
      </div>
    </header>
  );
}
