export const VULN_CATEGORIES = [
  "Access Control",
  "Authentication",
  "Business Logic",
  "Cross-Site Request Forgery (CSRF)",
  "Cross-Site Scripting (XSS)",
  "File Upload",
  "Injection (SQL / NoSQL / Command)",
  "Insecure Deserialization",
  "Information Disclosure",
  "Open Redirect",
  "Race Condition",
  "Server-Side Request Forgery (SSRF)",
  "Sensitive Data Exposure",
  "Misconfiguration",
  "Broken Authorization (IDOR)",
  "Other",
] as const;

export const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"] as const;
export type SeverityValue = (typeof SEVERITIES)[number];

export const SEVERITY_LABELS: Record<SeverityValue, string> = {
  CRITICAL: "بحرانی",
  HIGH: "بالا",
  MEDIUM: "متوسط",
  LOW: "کم",
  INFORMATIONAL: "اطلاعاتی",
};

export const ROLE_LABELS: Record<string, string> = {
  RESEARCHER: "پژوهشگر",
  ORGANIZATION: "سازمان",
  ADMIN: "مدیر",
};

export const PROGRAM_STATUS_LABELS: Record<string, string> = {
  DRAFT: "پیش‌نویس",
  PUBLIC: "عمومی",
  PRIVATE: "خصوصی",
  PAUSED: "متوقف‌شده",
};

export const TEAM_ROLE_LABELS: Record<string, string> = {
  OWNER: "مالک",
  MEMBER: "عضو",
  MANAGER: "مدیر برنامه",
};

export const STATUS_LABELS: Record<string, string> = {
  NEW: "جدید",
  TRIAGED: "بررسی‌شده",
  ACCEPTED: "پذیرفته‌شده",
  REJECTED: "رد‌شده",
  DUPLICATE: "تکراری",
  RESOLVED: "حل‌شده",
  REWARDED: "جایزه‌داده‌شده",
};

export const CATEGORY_LABELS: Record<string, string> = {
  "Access Control": "کنترل دسترسی",
  Authentication: "احراز هویت",
  "Business Logic": "منطق کسب‌وکار",
  "Cross-Site Request Forgery (CSRF)": "جعل درخواست بین‌سایتی (CSRF)",
  "Cross-Site Scripting (XSS)": "اسکریپت‌نویسی بین‌سایتی (XSS)",
  "File Upload": "آپلود فایل",
  "Injection (SQL / NoSQL / Command)": "تزریق (SQL / NoSQL / کامند)",
  "Insecure Deserialization": "ناامنی رمزگشایی سریال‌شده",
  "Information Disclosure": "افشای اطلاعات",
  "Open Redirect": "ریدایرکت باز",
  "Race Condition": "شرط رقابت",
  "Server-Side Request Forgery (SSRF)": "جعل درخواست سمت سرور (SSRF)",
  "Sensitive Data Exposure": "افشای داده‌های حساس",
  Misconfiguration: "پیکربندی نادرست",
  "Broken Authorization (IDOR)": "شکست مجوزدهی (IDOR)",
  Other: "سایر",
};

export const ASSET_TYPE_LABELS: Record<string, string> = {
  WEB: "وب",
  API: "ای‌پی‌آی",
  MOBILE: "موبایل",
  DESKTOP: "دسکتاپ",
  HARDWARE: "سخت‌افزار",
  OTHER: "سایر",
};

export const REPORT_STATUSES = [
  "NEW",
  "TRIAGED",
  "ACCEPTED",
  "REJECTED",
  "DUPLICATE",
  "RESOLVED",
  "REWARDED",
] as const;
export type ReportStatusValue = (typeof REPORT_STATUSES)[number];

export const POINTS: Record<SeverityValue, number> = {
  CRITICAL: 100,
  HIGH: 60,
  MEDIUM: 30,
  LOW: 10,
  INFORMATIONAL: 2,
};

export const DEFAULT_SEVERITY_REWARDS: Record<SeverityValue, number> = {
  CRITICAL: 5000,
  HIGH: 1500,
  MEDIUM: 500,
  LOW: 100,
  INFORMATIONAL: 0,
};

export const DISCLOSURE_POLICIES = [
  { value: "COORDINATED", label: "افشای هماهنگ‌شده" },
  { value: "FULL", label: "افشای کامل" },
  { value: "SAFE_HARBOR_ONLY", label: "فقط بخش‌بندی امن (Safe Harbor)" },
] as const;

export type AchievementDef = {
  key: string;
  title: string;
  description: string;
  check: (stats: AchievementStats) => boolean;
};

export type AchievementStats = {
  accepted: number;
  rewarded: number;
  critical: number;
  high: number;
  total: number;
  programs: number;
  firstBlood: number;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "FIRST_REPORT",
    title: "اولین تماس",
    description: "ارسال اولین گزارش آسیب‌پذیری",
    check: (s) => s.total >= 1,
  },
  {
    key: "FIRST_ACCEPT",
    title: "یافته معتبر",
    description: "پذیرفته‌شدن اولین گزارش",
    check: (s) => s.accepted >= 1,
  },
  {
    key: "ACCEPTED_5",
    title: "شکارچی پیگیر",
    description: "پذیرفته‌شدن ۵ گزارش",
    check: (s) => s.accepted >= 5,
  },
  {
    key: "ACCEPTED_20",
    title: "پژوهشگر حرفه‌ای",
    description: "پذیرفته‌شدن ۲۰ گزارش",
    check: (s) => s.accepted >= 20,
  },
  {
    key: "FIRST_CRITICAL",
    title: "ضربه‌زننده بحرانی",
    description: "پذیرفته‌شدن یک گزارش بحرانی",
    check: (s) => s.critical >= 1,
  },
  {
    key: "CRITICAL_5",
    title: "استاد بحرانی",
    description: "پذیرفته‌شدن ۵ گزارش بحرانی",
    check: (s) => s.critical >= 5,
  },
  {
    key: "REWARDED_1",
    title: "بانتی به‌دست‌آمده",
    description: "دریافت اولین جایزه",
    check: (s) => s.rewarded >= 1,
  },
  {
    key: "REWARDED_10",
    title: "کلکسیونر جایزه",
    description: "دریافت ۱۰ جایزه",
    check: (s) => s.rewarded >= 10,
  },
  {
    key: "HIGH_10",
    title: "ولتاژ بالا",
    description: "پذیرفته‌شدن ۱۰ گزارش با اهمیت بالا",
    check: (s) => s.high >= 10,
  },
  {
    key: "PROGRAMS_5",
    title: "چندبرنامه‌ای",
    description: "گزارش‌دهی به ۵ برنامه مختلف",
    check: (s) => s.programs >= 5,
  },
  {
    key: "FIRST_BLOOD",
    title: "اولین خون",
    description: "اولین پژوهشگر پذیرفته‌شده در یک برنامه",
    check: (s) => s.firstBlood >= 1,
  },
];

export const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  LOW: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  INFORMATIONAL: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
};

export const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  TRIAGED: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  ACCEPTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  DUPLICATE: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  RESOLVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  REWARDED: "bg-primary/10 text-primary border-primary/30",
};

export const SCOPE_ASSET_TYPES = [
  "WEB",
  "API",
  "MOBILE",
  "DESKTOP",
  "HARDWARE",
  "OTHER",
] as const;

export const BOUNTY_CURRENCIES = ["USD", "EUR", "GBP"] as const;

export const PAGE_SIZE = 12;

export type ScopeAsset = {
  type: string;
  identifier: string;
  eligibleForBounty: boolean;
  maxSeverity: SeverityValue;
  instruction?: string;
};
