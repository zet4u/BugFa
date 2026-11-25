import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
    >
      <ChevronRight className="h-4 w-4" /> {label}
    </Link>
  );
}
