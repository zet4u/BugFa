import "server-only";
import { z } from "zod";
import { VULN_CATEGORIES, SEVERITIES, SCOPE_ASSET_TYPES, BOUNTY_CURRENCIES } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "نام باید حداقل ۲ نویسه باشد").max(80),
    username: z
      .string()
      .min(3, "نام کاربری باید حداقل ۳ نویسه باشد")
      .max(30)
      .regex(/^[a-zA-Z0-9_-]+$/, "فقط حروف انگلیسی، عدد، خط تیره و زیرخط"),
    email: z.string().email("ایمیل معتبر وارد کنید"),
    password: z
      .string()
      .min(10, "رمز عبور باید حداقل ۱۰ نویسه باشد")
      .max(128)
      .regex(/[a-zA-Z]/, "حداقل یک حرف انگلیسی داشته باشد")
      .regex(/[0-9]/, "حداقل یک عدد داشته باشد"),
    confirmPassword: z.string(),
    role: z.enum(["RESEARCHER", "ORGANIZATION"]),
    organizationName: z.string().min(2).max(80).optional(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "باید شرایط استفاده را بپذیرید" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمزها یکسان نیستند",
    path: ["confirmPassword"],
  })
  .refine((data) => data.role !== "ORGANIZATION" || !!data.organizationName, {
    message: "نام سازمان الزامی است",
    path: ["organizationName"],
  });

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const passwordResetSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(10).max(128).regex(/[a-zA-Z]/).regex(/[0-9]/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمزها یکسان نیستند",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "فقط حروف انگلیسی، عدد، خط تیره و زیرخط"),
  bio: z.string().max(600).optional().or(z.literal("")),
  country: z.string().max(60).optional().or(z.literal("")),
  website: z.string().url("آدرس اینترنتی معتبر وارد کنید").optional().or(z.literal("")),
  github: z.string().max(60).optional().or(z.literal("")),
  twitter: z.string().max(60).optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "رمز عبور فعلی الزامی است"),
    password: z.string().min(10).max(128).regex(/[a-zA-Z]/).regex(/[0-9]/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمزها یکسان نیستند",
    path: ["confirmPassword"],
  });

export const scopeAssetSchema = z.object({
  type: z.enum(SCOPE_ASSET_TYPES),
  identifier: z.string().min(3).max(200),
  eligibleForBounty: z.boolean().default(true),
  maxSeverity: z.enum(SEVERITIES),
  instruction: z.string().max(300).optional(),
});

const severityRewardSchema = z.object({
  CRITICAL: z.number().int().min(0),
  HIGH: z.number().int().min(0),
  MEDIUM: z.number().int().min(0),
  LOW: z.number().int().min(0),
  INFORMATIONAL: z.number().int().min(0),
});

export const programSchema = z.object({
  title: z.string().min(4).max(120),
  summary: z.string().min(20, "خلاصه کوتاهی بنویسید (حداقل ۲۰ نویسه)").max(280),
  description: z.string().min(50, "توضیحات باید حداقل ۵۰ نویسه باشد"),
  website: z.string().url("آدرس اینترنتی معتبر وارد کنید"),
  status: z.enum(["DRAFT", "PUBLIC", "PRIVATE", "PAUSED"]),
  categories: z.array(z.enum(VULN_CATEGORIES)).min(1, "حداقل یک دسته‌بندی انتخاب کنید"),
  inScope: z.array(scopeAssetSchema).min(1, "حداقل یک دارایی در محدوده اضافه کنید"),
  outOfScope: z.array(
    z.object({
      identifier: z.string().min(3).max(200),
      note: z.string().max(300).optional(),
    })
  ),
  prohibited: z.array(z.string().min(3).max(200)).max(30).default([]),
  rules: z.string().max(8000).optional().or(z.literal("")),
  submissionRequirements: z.string().max(4000).optional().or(z.literal("")),
  disclosurePolicy: z.enum(["COORDINATED", "FULL", "SAFE_HARBOR_ONLY"]),
  safeHarbor: z.boolean().default(true),
  minBounty: z.number().int().min(0).max(10_000_000),
  maxBounty: z.number().int().min(0).max(10_000_000),
  currency: z.enum(BOUNTY_CURRENCIES).default("USD"),
  severityRewards: severityRewardSchema,
});

export const reportSchema = z.object({
  programId: z.string().min(3),
  title: z.string().min(8, "عنوان باید حداقل ۸ نویسه باشد").max(160),
  asset: z.string().min(3, "دارایی آسیب‌پذیر را مشخص کنید").max(200),
  category: z.enum(VULN_CATEGORIES),
  severity: z.enum(SEVERITIES),
  description: z.string().min(50, "توضیحات باید حداقل ۵۰ نویسه باشد"),
  steps: z.string().min(20, "مراحل بازتولید الزامی است"),
  impact: z.string().min(20, "میزان اثر را شرح دهید"),
  proofOfConcept: z.string().max(20000).optional().or(z.literal("")),
  remediation: z.string().max(5000).optional().or(z.literal("")),
});

export const commentSchema = z.object({
  reportId: z.string().min(3),
  body: z.string().min(1).max(5000),
});

export const statusUpdateSchema = z.object({
  reportId: z.string().min(3),
  status: z.enum([
    "NEW",
    "TRIAGED",
    "ACCEPTED",
    "REJECTED",
    "DUPLICATE",
    "RESOLVED",
    "REWARDED",
  ]),
  rewardAmount: z.number().int().min(0).max(10_000_000).nullable().optional(),
  note: z.string().max(5000).optional(),
});

export const disputeSchema = z.object({
  reportId: z.string().min(3),
  reason: z.string().min(20, "علت اختلاف را شرح دهید (حداقل ۲۰ نویسه)").max(4000),
});

export const disputeResolutionSchema = z.object({
  disputeId: z.string().min(3),
  resolution: z.string().min(10).max(4000),
  outcome: z.enum(["RESOLVED_SHARING_DECISION", "RESOLVED_REJECTED", "RESOLVED_ACCEPTED"]),
});

export type ProgramFormData = z.infer<typeof programSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
