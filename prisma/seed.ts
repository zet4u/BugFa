import { PrismaClient } from "@prisma/client";
import { ACHIEVEMENTS, POINTS } from "../lib/constants";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";


if (!process.env.DATABASE_URL) {
  const envPath = join(process.cwd(), ".env");
  try {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
      }
    }
  } catch {
    // no .env file, let Prisma throw
  }
}

const prisma = new PrismaClient();

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  console.log("Seeding BugFa…");

  await prisma.notification.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.reportComment.deleteMany();
  await prisma.report.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.teamInvite.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.program.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.authToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("Hunt3r!2024", 12);

  const users = await Promise.all(
    [
      {
        email: "admin@bugfa.dev",
        name: "Ada Nakamura",
        username: "admin",
        role: "ADMIN",
        emailVerified: daysAgo(400),
        country: "JP",
      },
      {
        email: "sec@nebulacdn.io",
        name: "Marcus Reyes",
        username: "nebula_sec",
        role: "ORGANIZATION",
        emailVerified: daysAgo(300),
        country: "US",
      },
      {
        email: "security@vaultpay.eu",
        name: "Priya Anand",
        username: "vaultpay_sec",
        role: "ORGANIZATION",
        emailVerified: daysAgo(280),
        country: "NL",
      },
      {
        email: "sec@driftmail.com",
        name: "Jonas Keller",
        username: "driftmail_sec",
        role: "ORGANIZATION",
        emailVerified: daysAgo(90),
        country: "DE",
      },
      { email: "lena@hunt.dev", name: "Lena Okafor", username: "lenapk", role: "RESEARCHER", emailVerified: daysAgo(380), country: "NG", bio: "Web security researcher. IDOR and logic bugs are my thing.", website: "https://lenapk.dev" },
      { email: "tomas@hunt.dev", name: "Tomás Ferreira", username: "tferz", role: "RESEARCHER", emailVerified: daysAgo(360), country: "PT", bio: "Full-time bug hunter focused on payments and fintech." },
      { email: "yuki@hunt.dev", name: "Yuki Sato", username: "yukisec", role: "RESEARCHER", emailVerified: daysAgo(340), country: "JP", bio: "Mobile and API security specialist." },
      { email: "omer@hunt.dev", name: "Ömer Yıldız", username: "omeryld", role: "RESEARCHER", emailVerified: daysAgo(300), country: "TR", bio: "GraphQL and API abuse specialist." },
      { email: "sara@hunt.dev", name: "Sara Lindqvist", username: "saralind", role: "RESEARCHER", emailVerified: daysAgo(250), country: "SE", bio: "Breaking auth flows since 2019." },
      { email: "darek@hunt.dev", name: "Dariusz Nowak", username: "dstorm", role: "RESEARCHER", emailVerified: daysAgo(200), country: "PL", bio: "Cloud and container escape enthusiast.", github: "dstorm" },
    ].map(async (u) =>
      prisma.user.create({
        data: {
          email: u.email,
          passwordHash: password,
          name: u.name,
          username: u.username,
          role: u.role as any,
          emailVerified: u.emailVerified ?? null,
          country: u.country,
          bio: (u as any).bio ?? null,
          website: (u as any).website ?? null,
          github: (u as any).github ?? null,
          createdAt: (u.emailVerified as Date | undefined) ?? daysAgo(400),
        },
      })
    )
  );

  const admin = users[0];
  const orgOwnerNebula = users[1];
  const orgOwnerVaultpay = users[2];
  const orgOwnerDrift = users[3];
  const lena = users[4];
  const tomas = users[5];
  const yuki = users[6];
  const omer = users[7];
  const sara = users[8];
  const darek = users[9];

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "platform.seeded", targetType: "Platform", createdAt: daysAgo(10) },
  });

  const orgNebula = await prisma.organization.create({
    data: {
      name: "Nebula CDN",
      slug: "nebula-cdn",
      description: "Edge network and content delivery infrastructure powering 40k+ websites.",
      website: "https://nebulacdn.io",
      twitter: "@nebulacdn",
      verified: true,
      ownerId: orgOwnerNebula.id,
    },
  });

  const orgVaultpay = await prisma.organization.create({
    data: {
      name: "VaultPay",
      slug: "vaultpay",
      description: "European payment platform for marketplaces and SaaS billing.",
      website: "https://vaultpay.eu",
      verified: true,
      ownerId: orgOwnerVaultpay.id,
    },
  });

  const orgDrift = await prisma.organization.create({
    data: {
      name: "DriftMail",
      slug: "driftmail",
      description: "Privacy-first transactional email for developers.",
      website: "https://driftmail.com",
      verified: false,
      ownerId: orgOwnerDrift.id,
    },
  });

  const scopeWeb = (domain: string) => [
    { type: "WEB", identifier: `*.${domain}`, eligibleForBounty: true, maxSeverity: "CRITICAL", instruction: "Use your own subdomain accounts when testing multi-tenant features." },
    { type: "API", identifier: `api.${domain}/v2`, eligibleForBounty: true, maxSeverity: "CRITICAL", instruction: "Versioned API only — v1 is deprecated." },
    { type: "WEB", identifier: `status.${domain}`, eligibleForBounty: false, maxSeverity: "LOW" },
  ];

  const progNebula = await prisma.program.create({
    data: {
      organizationId: orgNebula.id,
      title: "Nebula CDN Core",
      slug: "nebula-cdn-core",
      summary: "Test our edge network, dashboard and cache-control APIs.",
      description:
        "Nebula CDN serves traffic for over 40,000 websites. This program covers the customer dashboard, the provisioning API, and edge cache behaviors. We care most about cache poisoning, account takeover, and access control issues. Automated scanning without prior approval may result in removal from the program.",
      status: "PUBLIC",
      featured: true,
      minBounty: 100,
      maxBounty: 8000,
      currency: "USD",
      categories: ["Access Control", "Broken Authorization (IDOR)", "Misconfiguration", "Injection (SQL / NoSQL / Command)", "Server-Side Request Forgery (SSRF)", "Information Disclosure"],
      inScope: scopeWeb("nebulacdn.io") as any,
      outOfScope: [
        { identifier: "cdn.nebulacdn.io", note: "Shared delivery edge, telemetry only" },
        { identifier: "nebulacdn.statuspage.io", note: "Hosted by third party" },
      ] as any,
      prohibited: ["Automated scanners against production", "Social engineering our support team", "DDoS or resource-exhaustion tests", "Physical attacks"],
      rules: "Findings must be reproducible on the production environment. Rate-limit aggressive testing to 5 requests/second. Always use your own test accounts.",
      submissionRequirements: "Clear reproduction steps are mandatory. Videos are welcome for race conditions.",
      disclosurePolicy: "COORDINATED",
      safeHarbor: true,
      severityRewards: { CRITICAL: 8000, HIGH: 2500, MEDIUM: 700, LOW: 150, INFORMATIONAL: 0 } as any,
      publishedAt: daysAgo(200),
      createdAt: daysAgo(200),
    },
  });

  const progVaultpay = await prisma.program.create({
    data: {
      organizationId: orgVaultpay.id,
      title: "VaultPay Checkout",
      slug: "vaultpay-checkout",
      summary: "Payments core: checkout, billing portal and merchant API.",
      description:
        "VaultPay processes payments for European marketplaces. The program covers our hosted checkout, the merchant dashboard, and the public API v2. Focus areas are payment logic flaws, cross-tenant data leaks, and authentication bypasses. Please never use real cardholder data — test cards are provided in the docs.",
      status: "PUBLIC",
      featured: true,
      minBounty: 250,
      maxBounty: 15000,
      currency: "EUR",
      categories: ["Business Logic", "Broken Authorization (IDOR)", "Authentication", "Sensitive Data Exposure", "Cross-Site Scripting (XSS)"],
      inScope: scopeWeb("vaultpay.eu") as any,
      outOfScope: [{ identifier: "docs.vaultpay.eu", note: "Static documentation site" }] as any,
      prohibited: ["Testing with real cardholder data", "Spamming checkout with live transactions", "Phishing against our customers"],
      rules: "Use the provided sandbox merchant account for all interactions with checkout flows.",
      submissionRequirements: "Impact analysis is required for all business logic findings.",
      disclosurePolicy: "COORDINATED",
      safeHarbor: true,
      severityRewards: { CRITICAL: 15000, HIGH: 4000, MEDIUM: 1200, LOW: 250, INFORMATIONAL: 50 } as any,
      publishedAt: daysAgo(150),
      createdAt: daysAgo(150),
    },
  });

  const progDrift = await prisma.program.create({
    data: {
      organizationId: orgDrift.id,
      title: "DriftMail API",
      slug: "driftmail-api",
      summary: "Transactional email API and templating engine.",
      description:
        "DriftMail lets developers send transactional email through a simple API. This program covers the API gateway, template variables engine and webhook signing. We are a small team — reports are usually triaged within a week.",
      status: "PUBLIC",
      minBounty: 50,
      maxBounty: 2000,
      currency: "EUR",
      categories: ["Access Control", "Information Disclosure", "Misconfiguration", "Race Condition"],
      inScope: scopeWeb("driftmail.com") as any,
      outOfScope: [] as any,
      prohibited: ["Email bombing", "Spoofing our domain"],
      rules: null,
      submissionRequirements: null,
      disclosurePolicy: "SAFE_HARBOR_ONLY",
      safeHarbor: true,
      severityRewards: { CRITICAL: 2000, HIGH: 600, MEDIUM: 200, LOW: 50, INFORMATIONAL: 0 } as any,
      publishedAt: daysAgo(45),
      createdAt: daysAgo(45),
    },
  });

  const progVaultpayPrivate = await prisma.program.create({
    data: {
      organizationId: orgVaultpay.id,
      title: "VaultPay Mobile Beta",
      slug: "vaultpay-mobile-beta",
      summary: "iOS and Android beta apps for VaultPay merchants.",
      description:
        "Our merchant mobile apps are in closed beta. This program is invite-only and only visible to researchers with an accepted vulnerability in the main program. The focus is on local storage, deep links, and certificate pinning bypasses.",
      status: "PRIVATE",
      minBounty: 300,
      maxBounty: 10000,
      currency: "EUR",
      categories: ["Insecure Deserialization", "Authentication", "Sensitive Data Exposure"],
      inScope: [{ type: "MOBILE", identifier: "VaultPay iOS beta build 1.4.x", eligibleForBounty: true, maxSeverity: "CRITICAL", instruction: "Distribution via TestFlight invitation." }] as any,
      outOfScope: [] as any,
      prohibited: ["Jailbroken-device-only findings without real-world impact", "Tweaking the app store listing"],
      rules: "Beta builds may be unstable. Submit only reproducible crashes with security impact.",
      submissionRequirements: "Screen recording required for UI-level issues.",
      disclosurePolicy: "COORDINATED",
      safeHarbor: true,
      severityRewards: { CRITICAL: 10000, HIGH: 3000, MEDIUM: 900, LOW: 300, INFORMATIONAL: 0 } as any,
      publishedAt: null,
      createdAt: daysAgo(20),
    },
  });

  const progDriftPaused = await prisma.program.create({
    data: {
      organizationId: orgDrift.id,
      title: "DriftMail Legacy SMTP Relay",
      slug: "driftmail-legacy-relay",
      summary: "Legacy SMTP relay — currently under migration.",
      description:
        "Our legacy SMTP relay is being decommissioned this quarter. Reports are accepted but remediation may be delayed until the migration completes. This program is paused while we stabilize the new relay implementation.",
      status: "PAUSED",
      minBounty: 50,
      maxBounty: 500,
      currency: "EUR",
      categories: ["Misconfiguration", "Information Disclosure"],
      inScope: [{ type: "OTHER", identifier: "smtp-legacy.driftmail.com", eligibleForBounty: true, maxSeverity: "HIGH" }] as any,
      outOfScope: [] as any,
      prohibited: ["Mail flooding"],
      rules: null,
      submissionRequirements: null,
      disclosurePolicy: "SAFE_HARBOR_ONLY",
      safeHarbor: true,
      severityRewards: { CRITICAL: 500, HIGH: 300, MEDIUM: 150, LOW: 50, INFORMATIONAL: 0 } as any,
      publishedAt: daysAgo(400),
      createdAt: daysAgo(400),
    },
  });

  await prisma.organizationMember.create({
    data: { organizationId: orgVaultpay.id, userId: orgOwnerDrift.id, role: "MEMBER" },
  });

  const r = (
    programId: string,
    currency: string,
    researcherId: string,
    o: {
      title: string;
      asset: string;
      category: string;
      severity: string;
      status: string;
      days: number;
      reward?: number;
      points?: number;
      triaged?: boolean;
      resolved?: boolean;
    }
  ) =>
    prisma.report.create({
      data: {
        programId,
        researcherId,
        title: o.title,
        asset: o.asset,
        category: o.category,
        severity: o.severity as any,
        status: o.status as any,
        description:
          "A detailed description of the vulnerability, including the affected component, the preconditions required to trigger it, and why the existing controls do not prevent it.",
        steps:
          "1. Log in as a free-tier test account.\n2. Open the target endpoint and copy the request.\n3. Modify the identifier and replay the request.\n4. Observe the response leaking data from other accounts.",
        impact: "Full account takeover of any tenant is possible, leading to data exfiltration and unauthorized transactions.",
        proofOfConcept: "curl -i 'https://TARGET/api/v2/resource?id=1337' -H 'Authorization: Bearer $TOKEN'",
        remediation: "Validate object ownership server-side on every request and return 404 for foreign objects.",
        rewardAmount: o.reward ?? null,
        currency,
        points: o.points ?? 0,
        submittedAt: daysAgo(o.days),
        triagedAt: o.triaged ? daysAgo(Math.max(0, o.days - 2)) : null,
        resolvedAt: o.resolved ? daysAgo(Math.max(0, o.days - 6)) : null,
      },
    });

  const reportDefs = [
    [progNebula.id, "USD", lena.id, { title: "Cache poisoning on edge nodes via X-Forwarded-Host", asset: "*.nebulacdn.io", category: "Misconfiguration", severity: "CRITICAL", status: "REWARDED", days: 40, reward: 8000, points: 100, triaged: true, resolved: true }],
    [progNebula.id, "USD", tomas.id, { title: "IDOR in provisioning API exposes customer SSH keys", asset: "api.nebulacdn.io/v2/keys", category: "Broken Authorization (IDOR)", severity: "HIGH", status: "REWARDED", days: 28, reward: 2500, points: 60, triaged: true, resolved: true }],
    [progNebula.id, "USD", omer.id, { title: "SSRF through webhook test endpoint", asset: "api.nebulacdn.io/v2/hooks/test", category: "Server-Side Request Forgery (SSRF)", severity: "HIGH", status: "ACCEPTED", days: 12, points: 60, triaged: true }],
    [progNebula.id, "USD", sara.id, { title: "Session fixation after password reset", asset: "app.nebulacdn.io/reset", category: "Authentication", severity: "MEDIUM", status: "TRIAGED", days: 5, points: 0, triaged: true }],
    [progNebula.id, "USD", yuki.id, { title: "Reflected XSS in error page via crafted Accept header", asset: "app.nebulacdn.io/error", category: "Cross-Site Scripting (XSS)", severity: "LOW", status: "REJECTED", days: 16, points: 0, triaged: true, resolved: true }],
    [progNebula.id, "USD", darek.id, { title: "Cacheable 404 pages leak private bucket names", asset: "cdn.nebulacdn.io", category: "Information Disclosure", severity: "LOW", status: "NEW", days: 1 }],
    [progVaultpay.id, "EUR", tomas.id, { title: "Checkout amount can be changed after 3DS verification", asset: "checkout.vaultpay.eu", category: "Business Logic", severity: "CRITICAL", status: "REWARDED", days: 22, reward: 15000, points: 100, triaged: true, resolved: true }],
    [progVaultpay.id, "EUR", lena.id, { title: "Cross-merchant data leak via invoice export filter", asset: "app.vaultpay.eu/invoices?merchant=", category: "Broken Authorization (IDOR)", severity: "HIGH", status: "REWARDED", days: 35, reward: 4000, points: 60, triaged: true, resolved: true }],
    [progVaultpay.id, "EUR", omer.id, { title: "Stored XSS in merchant display name shown in receipts", asset: "checkout.vaultpay.eu/receipt", category: "Cross-Site Scripting (XSS)", severity: "HIGH", status: "TRIAGED", days: 8, points: 0, triaged: true }],
    [progVaultpay.id, "EUR", sara.id, { title: "2FA can be skipped by replaying the challenge token", asset: "app.vaultpay.eu/2fa", category: "Authentication", severity: "MEDIUM", status: "DUPLICATE", days: 18, points: 0, triaged: true }],
    [progDrift.id, "EUR", yuki.id, { title: "Webhook signature verification skips trailing newline", asset: "api.driftmail.com/v1/webhooks", category: "Other", severity: "MEDIUM", status: "ACCEPTED", days: 9, points: 30, triaged: true }],
    [progDrift.id, "EUR", lena.id, { title: "Template variables allow header injection in email previews", asset: "api.driftmail.com/v1/templates/preview", category: "Information Disclosure", severity: "LOW", status: "NEW", days: 2 }],
  ] as const;

  type CreatedReport = Awaited<ReturnType<typeof r>>;
  const reports: CreatedReport[] = [];
  for (const [programId, currency, researcherId, o] of reportDefs) {
    reports.push(await r(programId, currency, researcherId, { ...o } as any));
  }

  const byTitle = (t: string) => reports.find((x) => x.title === t)!;

  await prisma.reportComment.createMany({
    data: [
      {
        reportId: byTitle("Cache poisoning on edge nodes via X-Forwarded-Host").id,
        authorId: orgOwnerNebula.id,
        body: "Great catch — confirmed on our staging edge. Security team is preparing the fix.",
        createdAt: daysAgo(38),
      },
      {
        reportId: byTitle("Cache poisoning on edge nodes via X-Forwarded-Host").id,
        authorId: lena.id,
        body: "Happy to verify the fix once it ships. A cache key version bump should stop the bypass.",
        createdAt: daysAgo(37),
      },
      {
        reportId: byTitle("Cache poisoning on edge nodes via X-Forwarded-Host").id,
        authorId: orgOwnerNebula.id,
        body: "Fix deployed to 90% of the fleet. Reward sent at the Critical tier. Thank you!",
        internal: true,
        createdAt: daysAgo(34),
      },
      {
        reportId: byTitle("2FA can be skipped by replaying the challenge token").id,
        authorId: orgOwnerVaultpay.id,
        body: "This overlaps with a private finding from #VR-4412. Marking as duplicate.",
        createdAt: daysAgo(10),
      },
      {
        reportId: byTitle("SSRF through webhook test endpoint").id,
        authorId: omer.id,
        body: "Added a second PoC targeting the internal metadata service (blocked in PoC 2, works in PoC 1).",
        createdAt: daysAgo(11),
      },
    ],
  });

  await prisma.dispute.create({
    data: {
      reportId: byTitle("2FA can be skipped by replaying the challenge token").id,
      openedById: sara.id,
      reason:
        "The referenced duplicate (#VR-4412) only mentioned 2FA token expiry. My finding is about full challenge replay, which is a distinct root cause.",
      status: "OPEN",
      createdAt: daysAgo(7),
    },
  });

  await prisma.dispute.create({
    data: {
      reportId: byTitle("Reflected XSS in error page via crafted Accept header").id,
      openedById: yuki.id,
      reason: "The error page belongs to the customer dashboard listed in scope — this should not be out of scope.",
      status: "RESOLVED_ACCEPTED",
      resolution: "Reviewed the scope: the dashboard routes are in scope, the platform accepted the re-triage and re-opened triage duty for the vendor. Severity kept at Low.",
      resolvedAt: daysAgo(12),
      createdAt: daysAgo(14),
    },
  });

  await prisma.bookmark.createMany({
    data: [
      { userId: omer.id, programId: progVaultpay.id },
      { userId: omer.id, programId: progNebula.id },
      { userId: darek.id, programId: progDrift.id },
      { userId: sara.id, programId: progVaultpay.id },
    ],
  });

  const researcherIds = [lena.id, tomas.id, yuki.id, omer.id, sara.id, darek.id];
  const acceptedStatuses = ["ACCEPTED", "RESOLVED", "REWARDED"];
  for (const id of researcherIds) {
    const accepted = await prisma.report.findMany({
      where: { researcherId: id, status: { in: acceptedStatuses } as any },
      select: { severity: true, programId: true, status: true },
    });
    const stats = {
      accepted: accepted.length,
      rewarded: accepted.filter((x) => x.status === "REWARDED").length,
      critical: accepted.filter((x) => x.severity === "CRITICAL").length,
      high: accepted.filter((x) => x.severity === "HIGH").length,
      total: await prisma.report.count({ where: { researcherId: id } }),
      programs: new Set(accepted.map((x) => x.programId)).size,
      firstBlood: 0,
    };
    for (const def of ACHIEVEMENTS) {
      if (def.check(stats)) {
        await prisma.userAchievement.createMany({
          data: { userId: id, key: def.key, awardedAt: daysAgo(5) },
          skipDuplicates: true,
        });
      }
    }
    void POINTS;
  }

  await prisma.notification.createMany({
    data: [
      { userId: lena.id, type: "REPORT_STATUS", title: "Your report was rewarded", body: "Cache poisoning on edge nodes via X-Forwarded-Host — $8,000 at the Critical tier.", link: "/researcher/submissions", createdAt: daysAgo(34) },
      { userId: orgOwnerNebula.id, type: "REPORT_STATUS", title: "New report in Nebula CDN Core", body: "Cacheable 404 pages leak private bucket names.", link: "/org/reports", createdAt: daysAgo(1) },
      { userId: admin.id, type: "ORG_VERIFICATION", title: "DriftMail is awaiting verification", body: "Review the organization before their next program launch.", link: "/admin/organizations", createdAt: daysAgo(3) },
    ],
  });

  console.log("Seed complete:");
  console.log(`  users: ${users.length}, orgs: 3, programs: 5, reports: ${reports.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
