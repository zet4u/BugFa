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
  { value: "COORDINATED", label: "Coordinated disclosure" },
  { value: "FULL", label: "Full disclosure" },
  { value: "SAFE_HARBOR_ONLY", label: "Safe harbor only" },
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
    title: "First Contact",
    description: "Submit your first vulnerability report",
    check: (s) => s.total >= 1,
  },
  {
    key: "FIRST_ACCEPT",
    title: "Valid Find",
    description: "Get your first report accepted",
    check: (s) => s.accepted >= 1,
  },
  {
    key: "ACCEPTED_5",
    title: "Consistent Hunter",
    description: "Get 5 reports accepted",
    check: (s) => s.accepted >= 5,
  },
  {
    key: "ACCEPTED_20",
    title: "Serial Researcher",
    description: "Get 20 reports accepted",
    check: (s) => s.accepted >= 20,
  },
  {
    key: "FIRST_CRITICAL",
    title: "Critical Striker",
    description: "Get a critical severity report accepted",
    check: (s) => s.critical >= 1,
  },
  {
    key: "CRITICAL_5",
    title: "Critical Master",
    description: "Get 5 critical severity reports accepted",
    check: (s) => s.critical >= 5,
  },
  {
    key: "REWARDED_1",
    title: "Bounty Earned",
    description: "Receive your first bounty reward",
    check: (s) => s.rewarded >= 1,
  },
  {
    key: "REWARDED_10",
    title: "Bounty Collector",
    description: "Receive 10 bounty rewards",
    check: (s) => s.rewarded >= 10,
  },
  {
    key: "HIGH_10",
    title: "High Voltage",
    description: "Get 10 high severity reports accepted",
    check: (s) => s.high >= 10,
  },
  {
    key: "PROGRAMS_5",
    title: "Multi-Program",
    description: "Report to 5 different programs",
    check: (s) => s.programs >= 5,
  },
  {
    key: "FIRST_BLOOD",
    title: "First Blood",
    description: "Be the first researcher accepted on a program",
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
