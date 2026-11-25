import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("h-6 w-6", className)} aria-hidden>
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <path
        d="M16 7c-3.6 0-6.5.45-6.5.45l.9 12.1c.1 1.35 2.4 3.55 5.6 4.9 3.2-1.35 5.5-3.55 5.6-4.9l.9-12.1S19.6 7 16 7Z"
        className="fill-primary-foreground/10"
        stroke="currentColor"
        strokeWidth="0"
      />
      <path
        d="M16 8.2c-3.1 0-5.6.4-5.6.4l.8 10.8c.1 1.15 2.05 3.05 4.8 4.2 2.75-1.15 4.7-3.05 4.8-4.2l.8-10.8s-2.5-.4-5.6-.4Z"
        fill="#0b0c0e"
      />
      <path
        d="M13.1 15.9l2.1 2.2 3.9-4.2"
        stroke="hsl(40 94% 55%)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 group", className)}>
      <LogoMark />
      <span className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
        Bug<span className="text-primary">Fa</span>
      </span>
    </Link>
  );
}
