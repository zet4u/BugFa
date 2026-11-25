import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ORG_NAV } from "@/components/app/org-nav";
import { BackLink } from "@/components/app/back-link";
import { ProgramForm } from "@/components/app/program-form";

export const metadata: Metadata = { title: "New program" };

export default async function NewProgramPage() {
  await requireRole("ORGANIZATION", "ADMIN");
  return (
    <DashboardShell title="Create a program" nav={ORG_NAV} currentPath="/org/programs">
      <BackLink href="/org/programs" label="Back to programs" />
      <ProgramForm />
    </DashboardShell>
  );
}
