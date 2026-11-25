import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV } from "@/components/app/admin-nav";
import { POINTS, DEFAULT_SEVERITY_REWARDS, PAGE_SIZE } from "@/lib/constants";

export const metadata: Metadata = { title: "Platform settings" };

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");

  const config = {
    "Storage driver": process.env.STORAGE_DRIVER === "s3" ? "S3-compatible" : "Local disk (development)",
    "Rate limiting": "In-memory sliding window (login, register, reset, uploads)",
    "Session strategy": "JWT (Auth.js v5)",
    "Password hashing": "bcrypt (cost 12)",
    "Attachment size limit": "10 MB, MIME + extension allowlist, forced download",
    "Upload max per report": "5 files",
    "Security headers": "X-Frame-Options DENY, nosniff, strict referrer, permissions policy",
    "Points: Critical": String(POINTS.CRITICAL),
    "Points: High": String(POINTS.HIGH),
    "Points: Medium": String(POINTS.MEDIUM),
    "Points: Low": String(POINTS.LOW),
    "Points: Informational": String(POINTS.INFORMATIONAL),
    "Default severity rewards (USD)": JSON.stringify(DEFAULT_SEVERITY_REWARDS),
    "Page size": String(PAGE_SIZE),
    "Email delivery": process.env.SMTP_URL ? "SMTP connector" : "Dev console (links printed server-side only)",
  };

  return (
    <DashboardShell
      title="Platform settings"
      subtitle="Read-only view of active platform configuration"
      nav={ADMIN_NAV}
      currentPath="/admin/settings"
    >
      <div className="overflow-hidden rounded-lg border">
        <ul className="divide-y divide-border">
          {Object.entries(config).map(([k, v]) => (
            <li key={k} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">{k}</span>
              <span className="font-mono text-xs text-foreground">{v}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Configuration is controlled via environment variables (.env). Changing gamification values requires a deploy.
      </p>
    </DashboardShell>
  );
}
