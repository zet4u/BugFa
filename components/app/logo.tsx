import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/bugfa-shield.png"
      alt=""
      width={256}
      height={256}
      className={cn("h-6 w-6", className)}
      aria-hidden
      priority
    />
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center", className)}>
      <Image
        src="/bugfa-logo.png"
        alt="BugFa"
        width={416}
        height={144}
        className="h-8 w-auto transition-opacity group-hover:opacity-80"
        priority
      />
    </Link>
  );
}
