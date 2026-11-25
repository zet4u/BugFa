import Link from "next/link";
import { StatusBadge } from "@/components/app/status-badge";
import { SeverityBadge } from "@/components/app/severity-badge";
import { timeAgo } from "@/lib/utils";

export function ReportListRow({
  href,
  title,
  subtitle,
  severity,
  status,
  time,
}: {
  href: string;
  title: string;
  subtitle: string;
  severity: string;
  status: string;
  time: Date;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-primary/40"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle} · {timeAgo(time)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SeverityBadge severity={severity} />
        <StatusBadge status={status} />
      </div>
    </Link>
  );
}
