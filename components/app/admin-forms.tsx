"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  setOrgVerifiedAction,
  setUserForbiddenAction,
  setUserRoleAction,
  moderateProgramAction,
  resolveDisputeAction,
} from "@/lib/actions/admin";
import type { ActionState } from "@/lib/actions/auth";

export function OrgVerifyForm({ organizationId, verified }: { organizationId: string; verified: boolean }) {
  return (
    <form action={setOrgVerifiedAction}>
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="verified" value={verified ? "false" : "true"} />
      <Button type="submit" size="sm" variant={verified ? "outline" : "default"}>
        {verified ? "لغو تأیید" : "تأیید"}
      </Button>
    </form>
  );
}

export function UserBanForm({ userId, forbidden }: { userId: string; forbidden: boolean }) {
  return (
    <form action={setUserForbiddenAction}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="forbidden" value={forbidden ? "false" : "true"} />
      <Button type="submit" size="sm" variant={forbidden ? "outline" : "ghost"} className={forbidden ? "" : "text-destructive"}>
        {forbidden ? "رفع مسدودی" : "مسدودسازی"}
      </Button>
    </form>
  );
}

export function UserRoleForm({ userId, role }: { userId: string; role: string }) {
  return (
    <form action={setUserRoleAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Select name="role" defaultValue={role}>
        <SelectTrigger className="h-8 w-36" aria-label="نقش">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="RESEARCHER">پژوهشگر</SelectItem>
          <SelectItem value="ORGANIZATION">سازمان</SelectItem>
          <SelectItem value="ADMIN">مدیر</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" variant="outline">
        اعمال
      </Button>
    </form>
  );
}

export function ProgramModerateForm({ programId, status }: { programId: string; status: string }) {
  return (
    <form action={moderateProgramAction} className="flex items-center gap-2">
      <input type="hidden" name="programId" value={programId} />
      <Select name="status" defaultValue={status}>
        <SelectTrigger className="h-8 w-32" aria-label="وضعیت برنامه">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="DRAFT">پیش‌نویس</SelectItem>
          <SelectItem value="PUBLIC">عمومی</SelectItem>
          <SelectItem value="PRIVATE">خصوصی</SelectItem>
          <SelectItem value="PAUSED">متوقف</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" variant="outline">
        اعمال
      </Button>
    </form>
  );
}

export function DisputeResolveForm({ disputeId }: { disputeId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(resolveDisputeAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="disputeId" value={disputeId} />
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-xs text-primary">{state.success}</p> : null}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">یادداشت نتیجه</Label>
        <Textarea name="resolution" required minLength={10} rows={3}
          placeholder="تصمیم پلتفرم را برای دو طرف توضیح دهید." />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select name="outcome" defaultValue="RESOLVED_SHARING_DECISION">
          <SelectTrigger className="h-8 w-64" aria-label="نتیجه">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RESOLVED_ACCEPTED">بازنگری — گزارش پذیرفته شود</SelectItem>
            <SelectItem value="RESOLVED_REJECTED">تأیید تصمیم — گزارش رد بماند</SelectItem>
            <SelectItem value="RESOLVED_SHARING_DECISION">تصمیم فعلی حفظ شود</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "در حال بررسی…" : "حل اختلاف"}
        </Button>
      </div>
    </form>
  );
}

export function SimpleSearchInput({ basePath, placeholder }: { basePath: string; placeholder: string }) {
  const router = useRouter();

  return (
    <form
      action={(formData) => {
        const q = String(formData.get("q") ?? "").trim();
        router.push(q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath);
      }}
    >
      <input
        name="q"
        type="search"
        placeholder={placeholder}
        className="h-9 w-full max-w-sm rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </form>
  );
}
