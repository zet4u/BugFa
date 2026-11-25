import Link from "next/link";
import { Logo } from "@/components/app/logo";

const FOOTER_LINKS = [
  {
    heading: "Platform",
    links: [
      { href: "/explore", label: "Explore Programs" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/hall-of-fame", label: "Hall of Fame" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About BugFa" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { href: "/register", label: "Create account" },
      { href: "/login", label: "Log in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/40">
      <div className="container-app grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Powerful security starts with coordinated disclosure. BugFa connects ethical hackers with
            organizations that care.
          </p>
        </div>
        {FOOTER_LINKS.map((group) => (
          <div key={group.heading}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.heading}
            </h4>
            <ul className="space-y-2 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t py-4">
        <p className="container-app text-xs text-muted-foreground">
          © {new Date().getFullYear()} BugFa. Coordinated vulnerability disclosure, done right.
        </p>
      </div>
    </footer>
  );
}
