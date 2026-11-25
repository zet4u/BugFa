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
        name: "آدا ناکامورا",
        username: "admin",
        role: "ADMIN",
        emailVerified: daysAgo(400),
        country: "JP",
      },
      {
        email: "sec@nebulacdn.io",
        name: "مارکوس ریس",
        username: "nebula_sec",
        role: "ORGANIZATION",
        emailVerified: daysAgo(300),
        country: "US",
      },
      {
        email: "security@vaultpay.eu",
        name: "پریا آناند",
        username: "vaultpay_sec",
        role: "ORGANIZATION",
        emailVerified: daysAgo(280),
        country: "NL",
      },
      {
        email: "sec@driftmail.com",
        name: "یوناس کلر",
        username: "driftmail_sec",
        role: "ORGANIZATION",
        emailVerified: daysAgo(90),
        country: "DE",
      },
      { email: "lena@hunt.dev", name: "لنا اوکافور", username: "lenapk", role: "RESEARCHER", emailVerified: daysAgo(380), country: "NG", bio: "پژوهشگر امنیت وب. باگ‌های IDOR و منطقی تخصص من است.", website: "https://lenapk.dev" },
      { email: "tomas@hunt.dev", name: "توماس فریرا", username: "tferz", role: "RESEARCHER", emailVerified: daysAgo(360), country: "PT", bio: "شکارچی باگ تمام‌وقت با تمرکز بر پرداخت و فین‌تک." },
      { email: "yuki@hunt.dev", name: "یوکی ساتو", username: "yukisec", role: "RESEARCHER", emailVerified: daysAgo(340), country: "JP", bio: "متخصص امنیت موبایل و ای‌پی‌آی." },
      { email: "omer@hunt.dev", name: "عمر یلدیز", username: "omeryld", role: "RESEARCHER", emailVerified: daysAgo(300), country: "TR", bio: "متخصص GraphQL و سوءاستفاده از ای‌پی‌آی." },
      { email: "sara@hunt.dev", name: "سارا لیندکویست", username: "saralind", role: "RESEARCHER", emailVerified: daysAgo(250), country: "SE", bio: "از ۲۰۱۹ در حال شکستن جریان‌های احراز هویت." },
      { email: "darek@hunt.dev", name: "داریوش نوواک", username: "dstorm", role: "RESEARCHER", emailVerified: daysAgo(200), country: "PL", bio: "علاقه‌مند به فرار از فضای ابری و کانتینر.", github: "dstorm" },
      { email: "sec@aria-cloud.dev", name: "نیما رادمنش", username: "aria_sec", role: "ORGANIZATION", emailVerified: daysAgo(220), country: "AE" },
      { email: "sec@hexal.dev", name: "النا داگلاس", username: "hexal_sec", role: "ORGANIZATION", emailVerified: daysAgo(180), country: "SG" },
      { email: "sec@tokavent.io", name: "آرنج تیوتیو", username: "toka_sec", role: "ORGANIZATION", emailVerified: daysAgo(60), country: "TH" },
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
  const orgOwnerAria = users[10];
  const orgOwnerHexal = users[11];
  const orgOwnerToka = users[12];

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "platform.seeded", targetType: "Platform", createdAt: daysAgo(10) },
  });

  const orgNebula = await prisma.organization.create({
    data: {
      name: "Nebula CDN",
      slug: "nebula-cdn",
      description: "زیرساخت شبکه لبه و تحویل محتوا که بیش از ۴۰ هزار وب‌سایت را پشتیبانی می‌کند.",
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
      description: "پلتفرم پرداخت اروپایی برای مارکت‌پلیس‌ها و صورت‌حساب SaaS.",
      website: "https://vaultpay.eu",
      verified: true,
      ownerId: orgOwnerVaultpay.id,
    },
  });

  const orgDrift = await prisma.organization.create({
    data: {
      name: "DriftMail",
      slug: "driftmail",
      description: "ایمیل تراکنشی حریم‌خصوصی‌محور برای توسعه‌دهندگان.",
      website: "https://driftmail.com",
      verified: false,
      ownerId: orgOwnerDrift.id,
    },
  });

  const scopeWeb = (domain: string) => [
    { type: "WEB", identifier: `*.${domain}`, eligibleForBounty: true, maxSeverity: "CRITICAL", instruction: "برای تست قابلیت‌های چند‌مستأجری از حساب‌های زیردامنه خودتان استفاده کنید." },
    { type: "API", identifier: `api.${domain}/v2`, eligibleForBounty: true, maxSeverity: "CRITICAL", instruction: "فقط ای‌پی‌آی نسخه‌بندی‌شده — نسخه v1 منسوخ است." },
    { type: "WEB", identifier: `status.${domain}`, eligibleForBounty: false, maxSeverity: "LOW" },
  ];

  const progNebula = await prisma.program.create({
    data: {
      organizationId: orgNebula.id,
      title: "هسته Nebula CDN",
      slug: "nebula-cdn-core",
      summary: "شبکه لبه، داشبورد و ای‌پی‌آی‌های کنترل کش ما را تست کنید.",
      description:
        "Nebula CDN ترافیک بیش از چهل‌هزار وب‌سایت را سرو می‌کند. این برنامه شامل داشبورد مشتریان، ای‌پی‌آی تأمین منابع و رفتار کش لبه است. بیشترین اولویت ما آلودگی کش (Cache Poisoning)، تصاحب حساب کاربری و مشکلات کنترل دسترسی است. اسکن خودکار بدون هماهنگی قبلی ممکن است به حذف شما از برنامه منجر شود.",
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
      prohibited: ["اسکنرهای خودکار علیه محیط عملیات", "مهندسی اجتماعی تیم پشتیبانی ما", "تست‌های DDoS یا فرسایش منابع", "حملات فیزیکی"],
      rules: "یافته‌ها باید در محیط عملیات قابل بازتولید باشند. تست‌های تهاجمی را به ۵ درخواست بر ثانیه محدود کنید. همیشه از حساب‌های تستی خودتان استفاده کنید.",
      submissionRequirements: "گام‌های بازتولید واضح الزامی است. برای شرایط رقابتی (Race Condition) ویدئو خوش‌آمدید.",
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
      summary: "هسته پرداخت: تسویه، پورتال صورت‌حساب و ای‌پی‌آی پذیرندگان.",
      description:
        "VaultPay پردازش پرداخت‌ها برای مارکت‌پلیس‌های اروپایی را انجام می‌دهد. این برنامه شامل صفحه تسویه میزبانی‌شده، داشبورد پذیرندگان و ای‌پی‌آی عمومی v2 است. حوزه‌های تمرکز: ایرادهای منطق پرداخت، نشت داده بین‌مستأجری و دورزدن احراز هویت. لطفاً هرگز از داده واقعی صاحبان کارت استفاده نکنید — کارت‌های تستی در مستندات موجود است.",
      status: "PUBLIC",
      featured: true,
      minBounty: 250,
      maxBounty: 15000,
      currency: "EUR",
      categories: ["Business Logic", "Broken Authorization (IDOR)", "Authentication", "Sensitive Data Exposure", "Cross-Site Scripting (XSS)"],
      inScope: scopeWeb("vaultpay.eu") as any,
      outOfScope: [{ identifier: "docs.vaultpay.eu", note: "Static documentation site" }] as any,
      prohibited: ["تست با داده واقعی صاحبان کارت", "اسپم تسویه با تراکنش‌های واقعی", "فیشینگ علیه مشتریان ما"],
      rules: "برای تمام تعامل با جریان‌های تسویه از حساب پذیرنده سندباکس ارائه‌شده استفاده کنید.",
      submissionRequirements: "برای همه یافته‌های منطق کسب‌وکار، تحلیل تأثیر الزامی است.",
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
      summary: "ایمیل تراکنشی ای‌پی‌آی و موتور قالب‌سازی.",
      description:
        "DriftMail به توسعه‌دهندگان اجازه می‌دهد از طریق یک ای‌پی‌آی ساده ایمیل تراکنشی بفرستند. این برنامه شامل دروازه ای‌پی‌آی، موتور متغیرهای قالب و امضای وب‌هوک است. ما تیم کوچکی هستیم — گزارش‌ها معمولاً ظرف یک هفته بررسی اولیه می‌شوند.",
      status: "PUBLIC",
      minBounty: 50,
      maxBounty: 2000,
      currency: "EUR",
      categories: ["Access Control", "Information Disclosure", "Misconfiguration", "Race Condition"],
      inScope: scopeWeb("driftmail.com") as any,
      outOfScope: [] as any,
      prohibited: ["بمباران ایمیلی", "جعل دامنه ما"],
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
      title: "بتای موبایل VaultPay",
      slug: "vaultpay-mobile-beta",
      summary: "اپ‌های بتای iOS و اندروید برای پذیرندگان VaultPay.",
      description:
        "اپ‌های موبایل پذیرندگان ما در بتای بسته قرار دارند. این برنامه فقط با دعوت‌نامه و فقط برای پژوهشگرانی که در برنامه اصلی یک آسیب‌پذیری پذیرفته‌شده دارند قابل مشاهده است. تمرکز روی ذخیره‌سازی محلی، دیپ‌لینک‌ها و دورزدن سنجاق‌کردن گواهی است.",
      status: "PRIVATE",
      minBounty: 300,
      maxBounty: 10000,
      currency: "EUR",
      categories: ["Insecure Deserialization", "Authentication", "Sensitive Data Exposure"],
      inScope: [{ type: "MOBILE", identifier: "VaultPay iOS beta build 1.4.x", eligibleForBounty: true, maxSeverity: "CRITICAL", instruction: "توزیع از طریق دعوت‌نامه TestFlight." }] as any,
      outOfScope: [] as any,
      prohibited: ["یافته‌های صرفاً مخصوص دستگاه جیلبریک‌شده بدون تأثیر واقعی", "دستکاری صفحه اپ در استور"],
      rules: "نسخه‌های بتا ممکن است ناپایدار باشند. فقط کرش‌های قابل بازتولید با تأثیر امنیتی ارسال کنید.",
      submissionRequirements: "برای مشکلات سطح رابط کاربری، ضبط صفحه الزامی است.",
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
      title: "ریلی قدیمی SMTP درفت‌میل",
      slug: "driftmail-legacy-relay",
      summary: "ریلی قدیمی SMTP — در حال مهاجرت.",
      description:
        "ریلی قدیمی SMTP ما در این سه‌ماهه جمع‌آوری می‌شود. گزارش‌ها پذیرفته می‌شوند اما رفع مشکل ممکن است تا پایان مهاجرت به تعویق بیفتد. این برنامه تا پایدارشدن نسخه جدید ریلی متوقف است.",
      status: "PAUSED",
      minBounty: 50,
      maxBounty: 500,
      currency: "EUR",
      categories: ["Misconfiguration", "Information Disclosure"],
      inScope: [{ type: "OTHER", identifier: "smtp-legacy.driftmail.com", eligibleForBounty: true, maxSeverity: "HIGH" }] as any,
      outOfScope: [] as any,
      prohibited: ["سیل ایمیلی"],
      rules: null,
      submissionRequirements: null,
      disclosurePolicy: "SAFE_HARBOR_ONLY",
      safeHarbor: true,
      severityRewards: { CRITICAL: 500, HIGH: 300, MEDIUM: 150, LOW: 50, INFORMATIONAL: 0 } as any,
      publishedAt: daysAgo(400),
      createdAt: daysAgo(400),
    },
  });

  const orgAria = await prisma.organization.create({
    data: {
      name: "آریاکلود",
      slug: "aria-cloud",
      description: "سرویس میزبانی ابری و ذخیره‌سازی شیءگرا برای توسعه‌دهندگان خاورمیانه.",
      website: "https://aria-cloud.dev",
      verified: true,
      ownerId: orgOwnerAria.id,
    },
  });

  const orgHexal = await prisma.organization.create({
    data: {
      name: "Hexal",
      slug: "hexal",
      description: "کیف‌پول ارز دیجیتال غیرحضانتی با پشتیبانی چند‌زنجیره‌ای.",
      website: "https://hexal.dev",
      twitter: "@hexalwallet",
      verified: true,
      ownerId: orgOwnerHexal.id,
    },
  });

  const orgToka = await prisma.organization.create({
    data: {
      name: "توکاونت",
      slug: "tokavent",
      description: "پلتفرم فروش بلیت رویدادها، کنسرت‌ها و همایش‌ها.",
      website: "https://tokavent.io",
      verified: false,
      ownerId: orgOwnerToka.id,
    },
  });

  const progAriaCloud = await prisma.program.create({
    data: {
      organizationId: orgAria.id,
      title: "کنسول مدیریت آریاکلود",
      slug: "aria-cloud-console",
      summary: "کنسول مدیریت، ذخیره‌سازی شیءگرا و ای‌پی‌آی‌های زیرساخت ابری.",
      description:
        "آریاکلود زیرساخت ابری برای میزبانی وب‌سایت‌ها و دیتابیس‌هاست. این برنامه شامل کنسول مدیریت مشتریان، ای‌پی‌آی تامین منابع و لایه ذخیره‌سازی شیءگرا است. اولویت ما اشتباهات پیکربندی، نشت احراز هویت در ای‌پی‌آی و جداسازی ناقص بین پروژه‌های مشتریان (Cross-Tenant) است.",
      status: "PUBLIC",
      featured: true,
      minBounty: 100,
      maxBounty: 5000,
      currency: "USD",
      categories: ["Misconfiguration", "Information Disclosure", "Server-Side Request Forgery (SSRF)", "Access Control", "Injection (SQL / NoSQL / Command)"],
      inScope: [
        { type: "WEB", identifier: "console.aria-cloud.dev", eligibleForBounty: true, maxSeverity: "CRITICAL", instruction: "کنسول مدیریت — برای تست چند‌مستأجری دو پروژه جدا بسازید." },
        { type: "API", identifier: "api.aria-cloud.dev/v1", eligibleForBounty: true, maxSeverity: "CRITICAL" },
        { type: "OTHER", identifier: "bucket.aria-cloud.dev", eligibleForBounty: true, maxSeverity: "HIGH", instruction: "لایه ذخیره‌سازی شیءگرا — فقط با باکت خودتان کار کنید." },
      ] as any,
      outOfScope: [
        { identifier: "www.aria-cloud.dev", note: "وب‌سایت بازاریابی — فقط گزارش‌های اطلاعاتی" },
      ] as any,
      prohibited: ["اسکن تمام‌پورت کل سرویس سرور", "حذف یا تغییر داده پروژه‌های دیگران حتی تصادفی", "تست DoS روی لایه ذخیره‌سازی"],
      rules: "قبل از گزارش حتماً وجود یک کلاینت دوم برای چند‌مستاجری را در PoC نشان دهید. دسترسی به باکت‌های متعلق به مشتریان واقعی ممنوع است و بلافاصله باید گزارش شود.",
      submissionRequirements: "برای هر یافته، درخواست‌ها و پاسخ‌های کامل را ضمیمه کنید.",
      disclosurePolicy: "COORDINATED",
      safeHarbor: true,
      severityRewards: { CRITICAL: 5000, HIGH: 1500, MEDIUM: 500, LOW: 100, INFORMATIONAL: 0 } as any,
      publishedAt: daysAgo(120),
      createdAt: daysAgo(120),
    },
  });

  const progHexalWallet = await prisma.program.create({
    data: {
      organizationId: orgHexal.id,
      title: "کیف‌پول غیرحضانتی Hexal",
      slug: "hexal-wallet",
      summary: "اکستنشن مرورگر و اپ موبایل کیف‌پول چند‌زنجیره‌ای Hexal.",
      description:
        "Hexal یک کیف‌پول غیرحضانتی چند‌زنجیره‌ای است. این برنامه روی ایمپورت کلید خصوصی، علامت‌گذاری تراکنش، اتصال DApp و وریفیکیشن ارجینالیتی ای‌پی‌آی و نمایش جانشین‌سازی سفارش‌ها تمرکز دارد. ما در حوزه خطر بالا پرداخت می‌کنیم — هر یافته باید اثر امنیتی مستقیم روی دارایی کاربر داشته باشد.",
      status: "PUBLIC",
      featured: true,
      minBounty: 500,
      maxBounty: 25000,
      currency: "USD",
      categories: ["Business Logic", "Authentication", "Sensitive Data Exposure", "Insecure Deserialization", "Cross-Site Scripting (XSS)"],
      inScope: [
        { type: "WEB", identifier: "app.hexal.dev", eligibleForBounty: true, maxSeverity: "CRITICAL" },
        { type: "MOBILE", identifier: "Hexal Mobile 3.x (Android APK official build)", eligibleForBounty: true, maxSeverity: "CRITICAL" },
        { type: "API", identifier: "sapi.hexal.dev", eligibleForBounty: true, maxSeverity: "CRITICAL" },
      ] as any,
      outOfScope: [
        { identifier: "hexal.dev", note: "وب‌سایت معرفی محصول" },
        { identifier: "قراردادهای زنجیره‌ای توکن‌های شخص ثالث", note: "خارج از کنترل ما هستند" },
      ] as any,
      prohibited: ["کار با عبارت بازیابی شناس‌شده یا صادره‌شده از سرویس زنده", "برنامه‌های فیشینگ برای کاربران", "حمله به اینفراسترکچر گره‌های ایندکس‌کننده"],
      rules: "همه چیز باید تحت شبکه تست انجام شود مگر اینکه رفتار یکسان روی شبکه اصلی قابل اثبات باشد. گزارش‌های بدون اثر پولی/دارایی تایید نمی‌شوند.",
      submissionRequirements: "نسخه دقیق اپ (build number) و علامت‌گذاری تراکنش خام امضاشده الزامی است.",
      disclosurePolicy: "COORDINATED",
      safeHarbor: true,
      severityRewards: { CRITICAL: 25000, HIGH: 8000, MEDIUM: 2000, LOW: 500, INFORMATIONAL: 0 } as any,
      publishedAt: daysAgo(90),
      createdAt: daysAgo(90),
    },
  });

  const progHexalVault = await prisma.program.create({
    data: {
      organizationId: orgHexal.id,
      title: "Hexal Vault API",
      slug: "hexal-vault-api",
      summary: "ای‌پی‌آی خصوصی انبارداری کلیدهای سازمانی — فقط دعوتی.",
      description:
        "Hexal Vault سرویس مدیریت کلید برای مشتریان سازمانی است. این برنامه خصوصی است و فقط به پژوهشگرانی با حداقل دو گزارش تاییدشده در برنامه کیف‌پول دعوت می‌شوند. تم‌های اصلی: مسدودسازی ناقص بین حساب‌ها، لاگ‌های حساس و کنترل نشست‌های طولانی‌مدت.",
      status: "PRIVATE",
      minBounty: 1000,
      maxBounty: 30000,
      currency: "USD",
      categories: ["Broken Authorization (IDOR)", "Authentication", "Information Disclosure", "Business Logic"],
      inScope: [
        { type: "API", identifier: "vault.hexal.dev/api/v1", eligibleForBounty: true, maxSeverity: "CRITICAL" },
      ] as any,
      outOfScope: [] as any,
      prohibited: ["تست با کلیدهای تولیدی مشتریان", "تست رقابتی روی عملیات امضا"],
      rules: null,
      submissionRequirements: null,
      disclosurePolicy: "COORDINATED",
      safeHarbor: true,
      severityRewards: { CRITICAL: 30000, HIGH: 9000, MEDIUM: 2500, LOW: 1000, INFORMATIONAL: 0 } as any,
      publishedAt: null,
      createdAt: daysAgo(15),
    },
  });

  const progToka = await prisma.program.create({
    data: {
      organizationId: orgToka.id,
      title: "توکاونت — افروز بلیت رویدادها",
      slug: "tokavent-checkout",
      summary: "فروش بلیت، رزرو صندلی و فرآیند تسویه برگزارکنندگان.",
      description:
        "توکاونت پلتفرم فروش بلیت رویدادهاست. این برنامه شامل صفحه کشف رویدادها، فرآیند خرید بلیت و دش برگزارکنندگان است. تمرکز ما روی شرایط رقابتی در خرید بلیت (خرید دوباره همان صندلی)، دورزدن سقف تعداد خرید و ای‌دی‌اوار بین سفارش‌های کاربران است.",
      status: "PUBLIC",
      minBounty: 100,
      maxBounty: 5000,
      currency: "USD",
      categories: ["Access Control", "Broken Authorization (IDOR)", "Business Logic", "Race Condition"],
      inScope: [
        { type: "WEB", identifier: "*.tokavent.io", eligibleForBounty: true, maxSeverity: "CRITICAL", instruction: "دو حساب جدا برای تست دسترسی بین کاربران بسازید." },
        { type: "API", identifier: "api.tokavent.io/v1", eligibleForBounty: true, maxSeverity: "CRITICAL" },
      ] as any,
      outOfScope: [] as any,
      prohibited: ["خرید انبوه بلیت واقعی به هر نحوی", "آزمایش دورزدن سقف تعداد خرید", "تست اسپم رویدادهای واقعی برگزارکنندگان"],
      rules: "محیط مربوط به آزمایش (Sandbox) پرداخت برای همه تلاش‌های تسویه فعال است — از محیط پرداخت اصلی استفاده نکنید.",
      submissionRequirements: null,
      disclosurePolicy: "SAFE_HARBOR_ONLY",
      safeHarbor: true,
      severityRewards: { CRITICAL: 5000, HIGH: 1500, MEDIUM: 400, LOW: 100, INFORMATIONAL: 0 } as any,
      publishedAt: daysAgo(30),
      createdAt: daysAgo(30),
    },
  });

  const progTokaDraft = await prisma.program.create({
    data: {
      organizationId: orgToka.id,
      title: "اپ اسکنر بلیت توکاونت",
      slug: "tokavent-scanner",
      summary: "اپ اسکن حضوری بلیت در ورودی رویدادها — هنوز منتشر نشده.",
      description:
        "اپ اسکنر برای بلیت‌بارهایی که در ورودی رویدادها استفاده می‌کنند، در حال آماده‌سازی است. این برنامه به‌عنوان پیش‌نویس نگهداری می‌شود و پس از انتشار نسخه پایدار عمومی‌خواهد شد.",
      status: "DRAFT",
      minBounty: 100,
      maxBounty: 2000,
      currency: "USD",
      categories: ["Authentication", "Business Logic", "Misconfiguration"],
      inScope: [] as any,
      outOfScope: [] as any,
      prohibited: [] as any,
      rules: null,
      submissionRequirements: null,
      disclosurePolicy: "COORDINATED",
      safeHarbor: true,
      severityRewards: { CRITICAL: 2000, HIGH: 800, MEDIUM: 300, LOW: 100, INFORMATIONAL: 0 } as any,
      publishedAt: null,
      createdAt: daysAgo(7),
    },
  });

  await prisma.organizationMember.create({
    data: { organizationId: orgVaultpay.id, userId: orgOwnerDrift.id, role: "MEMBER" },
  });

  await prisma.organizationMember.create({
    data: { organizationId: orgHexal.id, userId: orgOwnerAria.id, role: "MANAGER" },
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
          "توضیح تفصیلی آسیب‌پذیری شامل کامپوننت تحت تأثیر، پیش‌شرط‌های لازم برای فعال‌سازی آن و اینکه چرا کنترل‌های موجود مانع آن نمی‌شوند.",
        steps:
          "۱. با حساب تستی پلن رایگان وارد شوید.\n۲. اندپوینت هدف را باز کنید و درخواست را کپی کنید.\n۳. شناسه را تغییر دهید و درخواست را دوباره بفرستید.\n۴. مشاهده می‌کنید پاسخ، داده حساب‌های دیگر را لو می‌دهد.",
        impact: "تصاحب کامل حساب هر مستأجری ممکن است که به سرقت داده و تراکنش‌های غیرمجاز منجر می‌شود.",
        proofOfConcept: "curl -i 'https://TARGET/api/v2/resource?id=1337' -H 'Authorization: Bearer $TOKEN'",
        remediation: "مالکیت شیء را در هر درخواست سمت سرور validate کنید و برای اشیای خارجی خطای ۴۰۴ برگردانید.",
        rewardAmount: o.reward ?? null,
        currency,
        points: o.points ?? 0,
        submittedAt: daysAgo(o.days),
        triagedAt: o.triaged ? daysAgo(Math.max(0, o.days - 2)) : null,
        resolvedAt: o.resolved ? daysAgo(Math.max(0, o.days - 6)) : null,
      },
    });

  const reportDefs = [
    [progNebula.id, "USD", lena.id, { title: "آلودگی کش روی نودهای لبه از طریق X-Forwarded-Host", asset: "*.nebulacdn.io", category: "Misconfiguration", severity: "CRITICAL", status: "REWARDED", days: 40, reward: 8000, points: 100, triaged: true, resolved: true }],
    [progNebula.id, "USD", tomas.id, { title: "ای‌دی‌او‌آر در ای‌پی‌آی تأمین منابع، کلیدهای SSH مشتریان را لو می‌دهد", asset: "api.nebulacdn.io/v2/keys", category: "Broken Authorization (IDOR)", severity: "HIGH", status: "REWARDED", days: 28, reward: 2500, points: 60, triaged: true, resolved: true }],
    [progNebula.id, "USD", omer.id, { title: "SSRF از طریق اندپوینت تست وب‌هوک", asset: "api.nebulacdn.io/v2/hooks/test", category: "Server-Side Request Forgery (SSRF)", severity: "HIGH", status: "ACCEPTED", days: 12, points: 60, triaged: true }],
    [progNebula.id, "USD", sara.id, { title: "تثبیت نشست پس از بازیابی رمز عبور", asset: "app.nebulacdn.io/reset", category: "Authentication", severity: "MEDIUM", status: "TRIAGED", days: 5, points: 0, triaged: true }],
    [progNebula.id, "USD", yuki.id, { title: "XSS بازتابی در صفحه خطا از طریق هدر Accept دستکاری‌شده", asset: "app.nebulacdn.io/error", category: "Cross-Site Scripting (XSS)", severity: "LOW", status: "REJECTED", days: 16, points: 0, triaged: true, resolved: true }],
    [progNebula.id, "USD", darek.id, { title: "صفحات ۴۰۴ قابل‌کش، نام باکت‌های خصوصی را لو می‌دهند", asset: "cdn.nebulacdn.io", category: "Information Disclosure", severity: "LOW", status: "NEW", days: 1 }],
    [progVaultpay.id, "EUR", tomas.id, { title: "مبلغ تسویه پس از تأیید 3DS قابل تغییر است", asset: "checkout.vaultpay.eu", category: "Business Logic", severity: "CRITICAL", status: "REWARDED", days: 22, reward: 15000, points: 100, triaged: true, resolved: true }],
    [progVaultpay.id, "EUR", lena.id, { title: "نشت داده بین‌پذیرندگان از طریق فیلتر خروجی فاکتور", asset: "app.vaultpay.eu/invoices?merchant=", category: "Broken Authorization (IDOR)", severity: "HIGH", status: "REWARDED", days: 35, reward: 4000, points: 60, triaged: true, resolved: true }],
    [progVaultpay.id, "EUR", omer.id, { title: "XSS ذخیره‌شده در نام نمایشی پذیرنده در رسیدها", asset: "checkout.vaultpay.eu/receipt", category: "Cross-Site Scripting (XSS)", severity: "HIGH", status: "TRIAGED", days: 8, points: 0, triaged: true }],
    [progVaultpay.id, "EUR", sara.id, { title: "دورزدن احراز دومرحله‌ای با پخش مجدد توکن چالش", asset: "app.vaultpay.eu/2fa", category: "Authentication", severity: "MEDIUM", status: "DUPLICATE", days: 18, points: 0, triaged: true }],
    [progDrift.id, "EUR", yuki.id, { title: "بررسی امضای وب‌هوک خط جدید انتهایی را نادیده می‌گیرد", asset: "api.driftmail.com/v1/webhooks", category: "Other", severity: "MEDIUM", status: "ACCEPTED", days: 9, points: 30, triaged: true }],
    [progDrift.id, "EUR", lena.id, { title: "متغیرهای قالب اجازه تزریق هدر در پیش‌نمایش ایمیل را می‌دهند", asset: "api.driftmail.com/v1/templates/preview", category: "Information Disclosure", severity: "LOW", status: "NEW", days: 2 }],
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
        reportId: byTitle("آلودگی کش روی نودهای لبه از طریق X-Forwarded-Host").id,
        authorId: orgOwnerNebula.id,
        body: "یافته عالی — در محیط آزمایشی لبه تأیید شد. تیم امنیتی در حال آماده‌سازی وصله است.",
        createdAt: daysAgo(38),
      },
      {
        reportId: byTitle("آلودگی کش روی نودهای لبه از طریق X-Forwarded-Host").id,
        authorId: lena.id,
        body: "با کمال میل پس از انتشار وصله، تأیید می‌کنم. افزایش نسخه کلید کش باید این دورزدن را قطع کند.",
        createdAt: daysAgo(37),
      },
      {
        reportId: byTitle("آلودگی کش روی نودهای لبه از طریق X-Forwarded-Host").id,
        authorId: orgOwnerNebula.id,
        body: "وصله روی ۹۰٪ خوشه مستقر شد. جایزه در سطح بحرانی پرداخت شد. ممنون!",
        internal: true,
        createdAt: daysAgo(34),
      },
      {
        reportId: byTitle("دورزدن احراز دومرحله‌ای با پخش مجدد توکن چالش").id,
        authorId: orgOwnerVaultpay.id,
        body: "این با یافته خصوصی #VR-4412 هم‌پوشانی دارد. به‌عنوان تکراری علامت می‌خورد.",
        createdAt: daysAgo(10),
      },
      {
        reportId: byTitle("SSRF از طریق اندپوینت تست وب‌هوک").id,
        authorId: omer.id,
        body: "یک PoC دوم علیه سرویس متادیتای داخلی اضافه کردم (در PoC 2 مسدود است، در PoC 1 جواب می‌دهد).",
        createdAt: daysAgo(11),
      },
    ],
  });

  await prisma.dispute.create({
    data: {
      reportId: byTitle("دورزدن احراز دومرحله‌ای با پخش مجدد توکن چالش").id,
      openedById: sara.id,
      reason:
        "تکراری ذکرشده (#VR-4412) فقط به انقضای توکن 2FA اشاره داشت. یافته من درباره پخش کامل چالش است که ریشه متمایزی دارد.",
      status: "OPEN",
      createdAt: daysAgo(7),
    },
  });

  await prisma.dispute.create({
    data: {
      reportId: byTitle("XSS بازتابی در صفحه خطا از طریق هدر Accept دستکاری‌شده").id,
      openedById: yuki.id,
      reason: "صفحه خطا مربوط به داشبورد مشتریان است که در محدوده ذکر شده — این نباید خارج از محدوده تلقی شود.",
      status: "RESOLVED_ACCEPTED",
      resolution: "محدوده بازبینی شد: مسیرهای داشبورد در محدوده هستند، پلتفرم بازبینی مجدد را پذیرفت و وظیفه بررسی اولیه برای سازمان بازگشایی شد. شدت روی کم باقی ماند.",
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
      { userId: lena.id, type: "REPORT_STATUS", title: "گزارش شما جایزه گرفت", body: "آلودگی کش روی نودهای لبه از طریق X-Forwarded-Host — هشت‌هزار دلار در سطح بحرانی.", link: "/researcher/submissions", createdAt: daysAgo(34) },
      { userId: orgOwnerNebula.id, type: "REPORT_STATUS", title: "گزارش جدید در هسته Nebula CDN", body: "صفحات ۴۰۴ قابل‌کش، نام باکت‌های خصوصی را لو می‌دهند.", link: "/org/reports", createdAt: daysAgo(1) },
      { userId: admin.id, type: "ORG_VERIFICATION", title: "DriftMail در انتظار تایید است", body: "قبل از انتشار برنامه بعدی این سازمان را بازبینی کنید.", link: "/admin/organizations", createdAt: daysAgo(3) },
    ],
  });

  console.log("Seed complete:");
  console.log(`  users: ${users.length}, orgs: 6, programs: 10, reports: ${reports.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
