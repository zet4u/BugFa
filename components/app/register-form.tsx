"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/lib/actions/auth";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, null);
  const [role, setRole] = useState<"RESEARCHER" | "ORGANIZATION">("RESEARCHER");
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="نوع حساب">
        {(["RESEARCHER", "ORGANIZATION"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            aria-pressed={role === r}
            className={`rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
              role === r
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-muted-foreground hover:bg-secondary"
            }`}
          >
            {r === "RESEARCHER" ? "پژوهشگر" : "سازمان"}
          </button>
        ))}
      </div>
      <input type="hidden" name="role" value={role} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{role === "ORGANIZATION" ? "نام شما" : "نام کامل"}</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">نام کاربری</Label>
          <Input id="username" name="username" required pattern="[a-zA-Z0-9_-]+" minLength={3} />
        </div>
      </div>
      {role === "ORGANIZATION" ? (
        <div className="space-y-2">
          <Label htmlFor="organizationName">نام سازمان</Label>
          <Input id="organizationName" name="organizationName" required minLength={2} />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">ایمیل</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">رمز عبور</Label>
          <Input id="password" name="password" type="password" required minLength={10} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={10} />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="acceptedTerms" required className="mt-0.5" />
        <span>
          <a href="/terms" className="text-primary hover:underline" target="_blank">
            شرایط استفاده
          </a>{" "}
          و{" "}
          <a href="/privacy" className="text-primary hover:underline" target="_blank">
            سیاست حریم خصوصی
          </a>{" "}
          را می‌پذیرم.
        </span>
      </label>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "در حال ساخت حساب…" : "ساخت حساب"}
      </Button>
    </form>
  );
}
