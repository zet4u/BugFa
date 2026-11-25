"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addCommentAction } from "@/lib/actions/reports";
import { Alert } from "@/components/app/settings-forms";

export function CommentForm({ reportId, isStaff }: { reportId: string; isStaff: boolean }) {
  const [state, formAction, pending] = useActionState(addCommentAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="reportId" value={reportId} />
      <Textarea name="body" rows={3} required maxLength={5000} placeholder="پیام خصوصی خود را بنویسید…" />
      {isStaff ? (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" name="internal" />
          یادداشت داخلی (برای پژوهشگر نمایش داده نمی‌شود)
        </label>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "در حال ارسال…" : "ارسال دیدگاه"}
      </Button>
    </form>
  );
}
