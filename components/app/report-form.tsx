"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitReportAction } from "@/lib/actions/reports";
import { VULN_CATEGORIES, SEVERITIES, SEVERITY_LABELS, CATEGORY_LABELS } from "@/lib/constants";

export function ReportForm({ programId, programTitle }: { programId: string; programTitle: string }) {
  const [state, formAction, pending] = useActionState(submitReportAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.push(state.success);
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="programId" value={programId} />
      {state?.error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">جزئیات آسیب‌پذیری</h2>
        <p className="text-xs text-muted-foreground">
          عنوان واضح و مراحل بازتولید دقیق، بررسی سریع‌تری به همراه دارد.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">عنوان</Label>
        <Input id="title" name="title" required minLength={8} maxLength={160}
          placeholder="مثلاً: XSS ذخیره‌شده در فیلد بیوگرافی پروفایل کاربری" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="asset">دارایی آسیب‌پذیر</Label>
          <Input id="asset" name="asset" required placeholder="https://app.example.com/profile" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="severity">شدت</Label>
          <Select name="severity" defaultValue="MEDIUM" required>
            <SelectTrigger id="severity" aria-label="شدت">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SEVERITY_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">دسته‌بندی</Label>
          <Select name="category" required>
            <SelectTrigger id="category" aria-label="دسته‌بندی">
              <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {VULN_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c] ?? c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">شرح کامل</Label>
        <Textarea id="description" name="description" required minLength={50} rows={5}
          placeholder="آسیب‌پذیری چیست و کدام بخش را تحت تأثیر قرار می‌دهد؟" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="steps">مراحل بازتولید</Label>
        <Textarea id="steps" name="steps" required minLength={20} rows={6}
          placeholder={"1. Go to…\n2. Enter…\n3. Observe…"} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="impact">میزان اثر</Label>
        <Textarea id="impact" name="impact" required minLength={20} rows={3}
          placeholder="مهاجم با این مشکل چه چیزی می‌تواند به دست بیاورد؟" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="proofOfConcept">اثبات مفهوم (اختیاری)</Label>
        <Textarea id="proofOfConcept" name="proofOfConcept" rows={5}
          className="font-mono text-xs"
          placeholder="کد PoC، درخواست/پاسخ یا پیلود را اینجا وارد کنید" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remediation">راه‌حل پیشنهادی (اختیاری)</Label>
        <Textarea id="remediation" name="remediation" rows={3} />
      </div>

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "در حال ارسال…" : `ارسال گزارش به ${programTitle}`}
      </Button>
    </form>
  );
}
