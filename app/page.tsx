import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgramCard } from "@/components/app/program-card";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { Search, ShieldCheck, Trophy, FileWarning, ArrowRight, Server, Users, Wallet } from "lucide-react";

export default async function LandingPage() {
  const [programs, stats] = await Promise.all([
    prisma.program.findMany({
      where: { status: "PUBLIC" },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 6,
      include: { organization: { select: { name: true, slug: true, verified: true, logoUrl: true } } },
    }),
    Promise.all([
      prisma.report.count({ where: { status: { in: ["ACCEPTED", "RESOLVED", "REWARDED"] } } }),
      prisma.user.count({ where: { role: "RESEARCHER" } }),
      prisma.report.aggregate({ where: { status: "REWARDED" }, _sum: { rewardAmount: true } }),
      prisma.program.count({ where: { status: "PUBLIC" } }),
    ]),
  ]);
  const [acceptedReports, researchers, totalPaid, activePrograms] = stats;

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden>
          <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 bg-primary/10 blur-[120px]" />
        </div>
        <div className="container-app relative flex flex-col items-center py-24 text-center sm:py-32">
          <Badge variant="secondary" className="mb-6 font-normal text-muted-foreground">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Bug bounty & coordinated vulnerability disclosure
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Find real bugs.
            <br />
            Get <span className="text-primary">fairly rewarded</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            BugFa connects security researchers with organizations that take security seriously.
            Discover programs, report vulnerabilities, and build a verified track record.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/explore">
                Browse programs <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">Run a program</Link>
            </Button>
          </div>
          <dl className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: FileWarning, label: "Accepted reports", value: acceptedReports },
              { icon: Users, label: "Researchers", value: researchers },
              { icon: Wallet, label: "Rewards paid", value: formatMoney(totalPaid._sum.rewardAmount ?? 0) },
              { icon: Server, label: "Live programs", value: activePrograms },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border bg-card p-4">
                <item.icon className="mx-auto mb-2 h-4 w-4 text-primary" />
                <dd className="text-xl font-bold">{item.value}</dd>
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-app py-20">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Live programs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Organizations currently accepting vulnerability reports.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/explore">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program as any} />
          ))}
        </div>
      </section>

      <section className="border-t bg-card/30">
        <div className="container-app grid gap-10 py-20 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Discover weaknesses before attackers do",
              body: "Programs clearly define scope, rules, and reward tables, so you always know what is in bounds and what it pays.",
            },
            {
              icon: ShieldCheck,
              title: "Fair, transparent triage",
              body: "Every report gets a tracked lifecycle — from submission to reward — with private discussion built in.",
            },
            {
              icon: Trophy,
              title: "Reputation that follows you",
              body: "Earn points, unlock achievements, and climb a leaderboard backed by real accepted findings.",
            },
          ].map((f) => (
            <div key={f.title}>
              <f.icon className="mb-4 h-6 w-6 text-primary" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-app py-20 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ready to make the internet a little safer?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Join researchers and organizations already coordinating security work on BugFa.
        </p>
        <Button asChild className="mt-6" size="lg">
          <Link href="/register">Create your free account</Link>
        </Button>
      </section>
    </>
  );
}
