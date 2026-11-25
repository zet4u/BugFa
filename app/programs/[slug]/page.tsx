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
import { formatMoney, formatPoints, timeAgo } from "@/lib/utils";
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
  if (!program) return { title: "برنامه یافت نشد" };
  if (program.status === "PRIVATE" && !isMember && session?.user.role !== "ADMIN") {
    return { title: "برنامه خصوصی", robots: { index: false, follow: false } };
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
        <h1 className="text-xl font-bold">برنامه خصوصی</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          این برنامه فقط برای پژوهشگران دعوت‌شده در دسترس است. برای مشاهده با حساب دعوت‌شده وارد شوید.
        </p>
        <Button asChild className="mt-6">
          <Link href="/login">ورود</Link>
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
    <div className="container-app max-w-5xl animate-fade-up py-10">
      {program.status === "PAUSED" ? (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <PauseCircle className="h-4 w-4" /> این برنامه موقتاً متوقف شده و در حال حاضر گزارش جدید نمی‌پذیرد.
        </div>
      ) : null}
      {program.status === "PRIVATE" ? (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-400">
          <Lock className="h-4 w-4" /> این یک برنامه خصوصی است. فقط برای پژوهشگران واجد شرایط.
        </div>
      ) : null}

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <ProgramTileIcon name={program.organization.name} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{program.title}</h1>
            {program.organization.verified ? (
              <Badge variant="secondary" className="gap-1 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> تاییدشده
              </Badge>
            ) : null}
            <ProgramStatusPill status={program.status} />
            {program.safeHarbor ? (
              <Badge variant="secondary" className="gap-1 font-normal text-muted-foreground">
                بندر امن
              </Badge>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{program.summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            منتشرکننده:{" "}
            <Link href={`/programs?organization=${program.organization.id}`} className="hover:text-primary">
              {program.organization.name}
            </Link>{" "}
            · منتشرشده {program.publishedAt ? timeAgo(program.publishedAt) : "به‌تازگی"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {session?.user.role === "RESEARCHER" ? (
            <form action={toggleBookmarkAction}>
              <input type="hidden" name="programId" value={program.id} />
              <Button type="submit" variant="outline" size="icon" aria-label="افزودن/حذف نشانک">
                {bookmarked ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
              </Button>
            </form>
          ) : null}
          {canSubmit ? (
            <Button asChild>
              <Link href={`/programs/${program.slug}/submit`}>ثبت گزارش</Link>
            </Button>
          ) : session ? null : (
            <Button asChild>
              <Link href={`/login?callbackUrl=/programs/${program.slug}`}>ورود برای ارسال گزارش</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">محدوده جایزه</p>
          <p className="mt-1 font-mono text-sm font-semibold text-primary">
            {program.maxBounty > 0
              ? `${formatMoney(program.minBounty, program.currency)} – ${formatMoney(program.maxBounty, program.currency)}`
              : "VDP (افشا)"}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">دسته‌بندی‌ها</p>
          <p className="mt-1 text-sm font-semibold">{program.categories.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">دارایی‌های در محدوده</p>
          <p className="mt-1 text-sm font-semibold">{inScope.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">کل گزارش‌ها</p>
          <p className="mt-1 text-sm font-semibold">{formatPoints(program._count.reports)}</p>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-lg font-semibold">توضیحات</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {program.description}
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">محدوده</h2>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-right font-medium">دارایی</th>
                    <th className="px-4 py-2 text-right font-medium">نوع</th>
                    <th className="px-4 py-2 text-right font-medium">شدت بیشینه</th>
                    <th className="px-4 py-2 text-right font-medium">جایزه</th>
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
                        {asset.eligibleForBounty ? "مشروط به جایزه" : "فقط تقدیر"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {((program.outOfScope as { identifier: string; note?: string }[] | null)?.length ?? 0) > 0 ? (
              <>
                <h3 className="mb-2 mt-4 text-sm font-semibold text-muted-foreground">خارج از محدوده</h3>
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
            <h2 className="mb-3 text-lg font-semibold">جدول جوایز</h2>
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
              <h2 className="mb-3 text-lg font-semibold">قوانین برنامه</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{program.rules}</p>
            </section>
          ) : null}

          {program.prohibited.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">فعالیت‌های ممنوع</h2>
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
              <h2 className="mb-3 text-lg font-semibold">الزامات ارسال گزارش</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {program.submissionRequirements}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">سیاست افشا</h3>
            <p className="text-sm text-muted-foreground">
              {program.disclosurePolicy === "COORDINATED"
                ? "افشای هماهنگ: گزارش‌ها پس از عرضه وصله و با ذکر نام پژوهشگر منتشر می‌شوند."
                : program.disclosurePolicy === "FULL"
                ? "افشای کامل پس از رفع مشکل مجاز است."
                : "شرایط افشای بندر امن برای یافته‌های درون محدوده اعمال می‌شود."}
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
            <h3 className="mb-2 text-sm font-semibold">درباره {program.organization.name}</h3>
            <p className="text-sm text-muted-foreground">{program.organization.description}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
