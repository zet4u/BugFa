import "server-only";
import { z } from "zod";
import { VULN_CATEGORIES, SEVERITIES, SCOPE_ASSET_TYPES, BOUNTY_CURRENCIES } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30)
      .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, dashes and underscores"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .max(128)
      .regex(/[a-zA-Z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one digit"),
    confirmPassword: z.string(),
    role: z.enum(["RESEARCHER", "ORGANIZATION"]),
    organizationName: z.string().min(2).max(80).optional(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms of Service" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.role !== "ORGANIZATION" || !!data.organizationName, {
    message: "Organization name is required",
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
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, dashes and underscores"),
  bio: z.string().max(600).optional().or(z.literal("")),
  country: z.string().max(60).optional().or(z.literal("")),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  github: z.string().max(60).optional().or(z.literal("")),
  twitter: z.string().max(60).optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password required"),
    password: z.string().min(10).max(128).regex(/[a-zA-Z]/).regex(/[0-9]/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
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
  summary: z.string().min(20, "Provide a short summary (min 20 chars)").max(280),
  description: z.string().min(50, "Description must be at least 50 characters"),
  website: z.string().url("Enter a valid URL"),
  status: z.enum(["DRAFT", "PUBLIC", "PRIVATE", "PAUSED"]),
  categories: z.array(z.enum(VULN_CATEGORIES)).min(1, "Select at least one category"),
  inScope: z.array(scopeAssetSchema).min(1, "Add at least one in-scope asset"),
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
  title: z.string().min(8, "Title must be at least 8 characters").max(160),
  asset: z.string().min(3, "Specify the affected asset").max(200),
  category: z.enum(VULN_CATEGORIES),
  severity: z.enum(SEVERITIES),
  description: z.string().min(50, "Description must be at least 50 characters"),
  steps: z.string().min(20, "Steps to reproduce required"),
  impact: z.string().min(20, "Describe the impact"),
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
  reason: z.string().min(20, "Explain the dispute (min 20 characters)").max(4000),
});

export const disputeResolutionSchema = z.object({
  disputeId: z.string().min(3),
  resolution: z.string().min(10).max(4000),
  outcome: z.enum(["RESOLVED_SHARING_DECISION", "RESOLVED_REJECTED", "RESOLVED_ACCEPTED"]),
});

export type ProgramFormData = z.infer<typeof programSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
