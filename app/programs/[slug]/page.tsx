import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { auth } from "@/lib/auth";
import { toggleBookmarkAction } from "@/lib/actions/bookmarks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SeverityBadge } from "@/components/app/severity-badge";
import { ProgramTileIcon, ProgramStatusPill } from "@/components/app/program-card";
import { formatMoney, timeAgo } from "@/lib/utils";
import type { ScopeAsset } from "@/lib/constants";
import { Bookmark, BookmarkCheck, ExternalLink, Globe2, ShieldCheck, PauseCircle, Lock } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const session = await getSession();
  const isMember = session
    ? !!(await prisma.organization.findFirst({
        where: { programs: { some: { slug } }, OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }] },
        select: { id: true },
      }))
    : false;
  const program = await prisma.program.findUnique({ where: { slug }, select: { title: true, summary: true, status: true } });
  if (!program) return { title: "Program not found" };
  if (program.status === "PRIVATE" && !isMember && session?.user.role !== "ADMIN") {
    return { title: "Private program", robots: { index: false, follow: false } };
  }
  return { title: program.title, description: program.summary };
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = await prisma.program.findUnique({
    where: { slug },
    include: {
      organization: { select: { id: true, name: true, verified: true, logoUrl: true, website: true, description: true } },
      _count: { select: { reports: true } },
    },
  });
  if (!program) notFound();

  const session = await getSession();
  const isMember = session
    ? await prisma.organization.findFirst({
        where: {
          id: program.organization.id,
          OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
        },
        select: { id: true },
      })
    : null;

  const hasAcceptedInOrg =
    session && program.status === "PRIVATE" && session.user.role === "RESEARCHER"
      ? !!(await prisma.report.findFirst({
          where: {
            researcherId: session.user.id,
            status: { in: ["ACCEPTED", "RESOLVED", "REWARDED"] as any },
            program: { organizationId: program.organization.id },
          },
          select: { id: true },
        }))
      : false;

  const canView =
    program.status === "PUBLIC" ||
    program.status === "PAUSED" ||
    (program.status === "PRIVATE" && (!!isMember || hasAcceptedInOrg || session?.user.role === "ADMIN"));

  if (!canView) {
    return (
      <div className="container-app max-w-md py-24 text-center">
        <Lock className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Private program</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This program is only available to invited researchers. Log in with an invited account to view it.
        </p>
        <Button asChild className="mt-6">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }

  const bookmarked = session
    ? !!(await prisma.bookmark.findUnique({
        where: { userId_programId: { userId: session.user.id, programId: program.id } },
      }))
    : false;

  const canSubmit =
    program.status === "PUBLIC" &&
    session?.user.role === "RESEARCHER";
  const severityRewards = program.severityRewards as Record<string, number>;
  const inScope = program.inScope as ScopeAsset[];

  return (
    <div className="container-app max-w-5xl py-10">
      {program.status === "PAUSED" ? (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <PauseCircle className="h-4 w-4" /> This program is paused and not accepting new reports right now.
        </div>
      ) : null}
      {program.status === "PRIVATE" ? (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-400">
          <Lock className="h-4 w-4" /> This is a private program. Eligible researchers only.
        </div>
      ) : null}

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <ProgramTileIcon name={program.organization.name} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{program.title}</h1>
            {program.organization.verified ? (
              <Badge variant="secondary" className="gap-1 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </Badge>
            ) : null}
            <ProgramStatusPill status={program.status} />
            {program.safeHarbor ? (
              <Badge variant="secondary" className="gap-1 font-normal text-muted-foreground">
                Safe harbor
              </Badge>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{program.summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Run by{" "}
            <Link href={`/programs?organization=${program.organization.id}`} className="hover:text-primary">
              {program.organization.name}
            </Link>{" "}
            · Published {program.publishedAt ? timeAgo(program.publishedAt) : "recently"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {session?.user.role === "RESEARCHER" ? (
            <form action={toggleBookmarkAction}>
              <input type="hidden" name="programId" value={program.id} />
              <Button type="submit" variant="outline" size="icon" aria-label="Toggle bookmark">
                {bookmarked ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
              </Button>
            </form>
          ) : null}
          {canSubmit ? (
            <Button asChild>
              <Link href={`/programs/${program.slug}/submit`}>Submit report</Link>
            </Button>
          ) : session ? null : (
            <Button asChild>
              <Link href={`/login?callbackUrl=/programs/${program.slug}`}>Log in to report</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Bounty range</p>
          <p className="mt-1 font-mono text-sm font-semibold text-primary">
            {program.maxBounty > 0
              ? `${formatMoney(program.minBounty, program.currency)} – ${formatMoney(program.maxBounty, program.currency)}`
              : "VDP"}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Categories</p>
          <p className="mt-1 text-sm font-semibold">{program.categories.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">In-scope assets</p>
          <p className="mt-1 text-sm font-semibold">{inScope.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total reports</p>
          <p className="mt-1 text-sm font-semibold">{program._count.reports}</p>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-lg font-semibold">Description</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {program.description}
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Scope</h2>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Asset</th>
                    <th className="px-4 py-2 text-left font-medium">Type</th>
                    <th className="px-4 py-2 text-left font-medium">Max severity</th>
                    <th className="px-4 py-2 text-left font-medium">Bounty</th>
                  </tr>
                </thead>
                <tbody>
                  {inScope.map((asset, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2.5 font-mono text-xs">{asset.identifier}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{asset.type}</td>
                      <td className="px-4 py-2.5">
                        <SeverityBadge severity={asset.maxSeverity} />
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {asset.eligibleForBounty ? "Eligible" : "Recognition only"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {((program.outOfScope as { identifier: string; note?: string }[] | null)?.length ?? 0) > 0 ? (
              <>
                <h3 className="mb-2 mt-4 text-sm font-semibold text-muted-foreground">Out of scope</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {(program.outOfScope as { identifier: string; note?: string }[]).map((asset, i) => (
                    <li key={i}>
                      <span className="font-mono text-xs text-foreground">{asset.identifier}</span>
                      {asset.note ? ` — ${asset.note}` : ""}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Reward table</h2>
            <div className="grid gap-2 sm:grid-cols-5">
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"] as const).map((sev) => (
                <div key={sev} className="rounded-lg border bg-card p-3 text-center">
                  <SeverityBadge severity={sev} />
                  <p className="mt-2 font-mono text-sm font-semibold">
                    {formatMoney(severityRewards[sev] ?? 0, program.currency)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {program.rules ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Program rules</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{program.rules}</p>
            </section>
          ) : null}

          {program.prohibited.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Prohibited activities</h2>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {program.prohibited.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-destructive">✗</span> {p}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {program.submissionRequirements ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Submission requirements</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {program.submissionRequirements}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Disclosure policy</h3>
            <p className="text-sm text-muted-foreground">
              {program.disclosurePolicy === "COORDINATED"
                ? "Coordinated disclosure: reports are published after a fix ships, with researcher credit."
                : program.disclosurePolicy === "FULL"
                ? "Full disclosure allowed once the issue is resolved."
                : "Safe harbor disclosure terms apply to in-scope findings."}
            </p>
            {program.organization.website ? (
              <a
                href={program.organization.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Globe2 className="h-3.5 w-3.5" /> {new URL(program.organization.website).hostname}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
          <Separator />
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold">About {program.organization.name}</h3>
            <p className="text-sm text-muted-foreground">{program.organization.description}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
