import Link from "next/link";
import { Logo } from "@/components/app/logo";

const FOOTER_LINKS = [
  {
    heading: "پلتفرم",
    links: [
      { href: "/explore", label: "کاوش برنامه‌ها" },
      { href: "/leaderboard", label: "جدول امتیازات" },
      { href: "/hall-of-fame", label: "تالار افتخار" },
    ],
  },
  {
    heading: "شرکت",
    links: [
      { href: "/about", label: "درباره BugFa" },
      { href: "/terms", label: "شرایط استفاده" },
      { href: "/privacy", label: "سیاست حریم خصوصی" },
    ],
  },
  {
    heading: "شروع کنید",
    links: [
      { href: "/register", label: "ساخت حساب" },
      { href: "/login", label: "ورود" },
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
            امنیت قدرتمند با افشای هماهنگ‌شده شروع می‌شود. BugFa هکرهای اخلاقی را با سازمان‌هایی که اهمیت می‌دهند متصل می‌کند.
          </p>
        </div>
        {FOOTER_LINKS.map((group) => (
          <div key={group.heading}>
            <h4 className="mb-3 text-xs font-semibold text-muted-foreground">
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
          © {new Date().getFullYear()} BugFa. افشای هماهنگ آسیب‌پذیری، به روشی درست.
        </p>
      </div>
    </footer>
  );
}
