import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ReportForm } from "@/components/app/report-form";
import { SeverityBadge } from "@/components/app/severity-badge";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Submit report" };

export default async function SubmitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?callbackUrl=/programs/${slug}/submit`);
  if (session.user.role !== "RESEARCHER") redirect("/dashboard");

  const program = await prisma.program.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      summary: true,
      status: true,
      currency: true,
      severityRewards: true,
      submissionRequirements: true,
      prohibited: true,
    },
  });
  if (!program || program.status !== "PUBLIC") notFound();

  const rewards = program.severityRewards as Record<string, number>;

  return (
    <div className="container-app max-w-3xl py-10">
      <h1 className="text-2xl font-bold tracking-tight">Submit a report</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Target: <span className="font-medium text-foreground">{program.title}</span>
      </p>

      <div className="my-6 rounded-lg border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Reward table</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"] as const).map((sev) => (
            <span key={sev} className="flex items-center gap-2 text-sm">
              <SeverityBadge severity={sev} />
              <span className="font-mono text-xs text-muted-foreground">
                {formatMoney(rewards[sev] ?? 0, program.currency)}
              </span>
            </span>
          ))}
        </div>
        {program.prohibited.length > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Prohibited: {program.prohibited.slice(0, 3).join(" · ")}
            {program.prohibited.length > 3 ? ` +${program.prohibited.length - 3} more` : ""}
          </p>
        ) : null}
      </div>

      {program.submissionRequirements ? (
        <div className="my-6 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <h2 className="mb-1 text-sm font-semibold">Submission requirements</h2>
          <p className="whitespace-pre-wrap text-muted-foreground">{program.submissionRequirements}</p>
        </div>
      ) : null}

      <ReportForm programId={program.id} programTitle={program.title} />
    </div>
  );
}
