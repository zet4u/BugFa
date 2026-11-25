import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("h-6 w-6", className)} aria-hidden>
      <path
        d="M16 2.4c-3.6 1.7-6.9 2.3-9.7 2.4l.2 9.4c.1 6.9 4 12.5 9.5 15.4 5.5-2.9 9.4-8.5 9.5-15.4l.2-9.4C22.9 4.7 19.6 4.1 16 2.4Z"
        className="fill-primary"
      />
      <g fill="var(--logo-cutout, #0b0c0e)" stroke="var(--logo-cutout, #0b0c0e)">
        <circle cx="16" cy="11.6" r="2.5" stroke="none" />
        <ellipse cx="16" cy="18.4" rx="4.5" ry="5.2" stroke="none" />
        <path d="M14.6 10.2 12.9 7.9M17.4 10.2 19.1 7.9" strokeWidth="1.3" strokeLinecap="round" />
        <path
          d="M11.9 14.6 9 13M11.4 18.4H7.7M12 21.9 9.3 23.7M20.1 14.6 23 13M20.6 18.4h3.7M20 21.9l2.7 1.8"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 group", className)}>
      <LogoMark className="transition-transform duration-200 group-hover:scale-105" />
      <span className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
        Bug<span className="text-primary">Fa</span>
      </span>
    </Link>
  );
}
