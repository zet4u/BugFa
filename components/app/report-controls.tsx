"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateReportStatusAction } from "@/lib/actions/reports";
import { STATUS_LABELS } from "@/lib/constants";
import { Alert } from "@/components/app/settings-forms";

export function StatusControls({
  reportId,
  currentStatus,
  rewardDefault,
  currency,
}: {
  reportId: string;
  currentStatus: string;
  rewardDefault: number | null;
  currency: string;
}) {
  const [state, formAction, pending] = useActionState(updateReportStatusAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);

  const needsReward = false;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">به‌روزرسانی بررسی</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>بررسی گزارش</DialogTitle>
          <DialogDescription>
            وضعیت را به‌روزرسانی کنید و یادداشتی برای پژوهشگر بفرستید. حالت «جایزه‌داده‌شده» جایزه را اعمال می‌کند.
          </DialogDescription>
        </DialogHeader>
        <form ref={ref} action={formAction} className="space-y-4">
          {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
          {state?.success ? <Alert tone="success">{state.success}</Alert> : null}
          <input type="hidden" name="reportId" value={reportId} />
          <div className="space-y-2">
            <Label htmlFor="status">وضعیت جدید</Label>
            <Select name="status" defaultValue={currentStatus === "NEW" ? "TRIAGED" : currentStatus}>
              <SelectTrigger id="status" aria-label="وضعیت جدید">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["TRIAGED", "ACCEPTED", "RESOLVED", "REWARDED", "DUPLICATE", "REJECTED", "NEW"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rewardAmount">مقدار جایزه ({currency}) — فقط هنگام پرداخت جایزه</Label>
            <Input
              id="rewardAmount"
              name="rewardAmount"
              type="number"
              min={0}
              defaultValue={rewardDefault ?? 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">یادداشت برای پژوهشگر (اختیاری)</Label>
            <Textarea id="note" name="note" rows={3} placeholder="توضیح این تغییر وضعیت…" />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "در حال اعمال…" : "اعمال تغییر"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DisputeForm({ reportId }: { reportId: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const { openDisputeAction } = await import("@/lib/actions/reports");
      return openDisputeAction(_prev, formData);
    },
    null
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          اعتراض به این تصمیم
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ثبت اختلاف</DialogTitle>
          <DialogDescription>
            تیم BugFa گزارش، قوانین برنامه و تصمیم بررسی را مطالعه می‌کند.
          </DialogDescription>
        </DialogHeader>
        {state?.success ? (
          <p className="text-sm text-emerald-400">{state.success}</p>
        ) : (
          <form action={formAction} className="space-y-4">
            {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
            <input type="hidden" name="reportId" value={reportId} />
            <div className="space-y-2">
              <Label htmlFor="reason">چرا با این بررسی مخالف هستید؟</Label>
              <Textarea id="reason" name="reason" rows={5} required minLength={20} />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "در حال ارسال…" : "ثبت اختلاف"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
