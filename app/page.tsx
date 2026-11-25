import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgramCard } from "@/components/app/program-card";
import { Reveal } from "@/components/app/reveal";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatPoints } from "@/lib/utils";
import { Search, ShieldCheck, Trophy, FileWarning, ArrowLeft, Server, Users, Wallet } from "lucide-react";

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
          <Badge variant="secondary" className="animate-fade-in mb-6 font-normal text-muted-foreground">
            <ShieldCheck className="ms-1.5 h-3.5 w-3.5 text-primary" />
            باگ بانتی و افشای هماهنگ آسیب‌پذیری
          </Badge>
          <h1 className="animate-fade-up mx-auto max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            شکار باگ‌های واقعی، <span className="text-primary">جایزه‌دهی منصفانه.</span>
          </h1>
          <p className="animate-fade-up mt-6 max-w-2xl text-lg leading-8 text-muted-foreground [animation-delay:120ms]">
            BugFa پژوهشگران امنیتی را با سازمان‌هایی که امنیت را جدی می‌گیرند متصل می‌کند.
            برنامه‌ها را کشف کن، آسیب‌پذیری‌ها را گزارش کن و رکورد تأییدشده بساز.
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3 [animation-delay:240ms]">
            <Button asChild size="lg">
              <Link href="/explore">
                کاوش برنامه‌ها <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">اجرای برنامه</Link>
            </Button>
          </div>
          <dl className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: FileWarning, label: "گزارش‌های پذیرفته‌شده", value: formatPoints(acceptedReports) },
              { icon: Users, label: "پژوهشگران", value: formatPoints(researchers) },
              { icon: Wallet, label: "جایزه‌های پرداخت‌شده", value: formatMoney(totalPaid._sum.rewardAmount ?? 0) },
              { icon: Server, label: "برنامه‌های فعال", value: formatPoints(activePrograms) },
            ].map((item, i) => (
              <div key={item.label} className="animate-fade-up card-hover rounded-lg border bg-card p-4" style={{ animationDelay: `${300 + i * 90}ms` }}>
                <item.icon className="mx-auto mb-2 h-4 w-4 text-primary" />
                <dd className="text-xl font-bold">{item.value}</dd>
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-app py-20">
        <Reveal className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">برنامه‌های فعال</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              سازمان‌هایی که هم‌اکنون گزارش آسیب‌پذیری می‌پذیرند.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/explore">
              دیدن همه <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program, i) => (
            <Reveal key={program.id} delay={i * 80}>
              <ProgramCard program={program as any} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t bg-card/30">
        <div className="container-app grid gap-10 py-20 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "ضعف‌ها را قبل از مهاجمان کشف کن",
              body: "برنامه‌ها محدوده، قوانین و جدول جوایز را شفاف مشخص می‌کنند تا همیشه بدانی چه چیزی در محدوده است و چه می‌پردازد.",
            },
            {
              icon: ShieldCheck,
              title: "بررسی منصفانه و شفاف",
              body: "هر گزارش یک چرخه پیگیری‌شده دارد — از ارسال تا جایزه — با گفتگوی خصوصی داخلی.",
            },
            {
              icon: Trophy,
              title: "اعتباری که با تو می‌آید",
              body: "امتیاز جمع کن، نشان‌ها را باز کن و با یافته‌های واقعیِ پذیرفته‌شده در جدول امتیازات بالا برو.",
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <f.icon className="mb-4 h-6 w-6 text-primary" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{f.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-app py-20 text-center">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            آماده‌ای اینترنت را کمی امن‌تر کنی؟
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            به پژوهشگران و سازمان‌هایی بپیوند که همین حالا روی BugFa همکاری امنیتی می‌کنند.
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link href="/register">ساخت حساب رایگان</Link>
          </Button>
        </Reveal>
      </section>
    </>
  );
}
