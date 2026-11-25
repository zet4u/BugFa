import Link from "next/link";
import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/session";

export type NavItem = { href: string; label: string };

export function DashboardShell({
  title,
  subtitle,
  nav,
  currentPath,
  children,
  header,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  currentPath: string;
  children: ReactNode;
  header?: ReactNode;
}) {
  return (
    <div className="container-app py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        {header ? <div className="mt-4">{header}</div> : null}
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="lg:self-start" aria-label="Dashboard">
          <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {nav.map((item) => {
              const active =
                currentPath === item.href ||
                (item.href !== "/researcher" &&
                 item.href !== "/org" &&
                 item.href !== "/admin" &&
                 currentPath.startsWith(item.href + "/"));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-secondary font-medium text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
