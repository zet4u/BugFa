import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/app/forgot-password-form";

export const metadata: Metadata = { title: "فراموشی رمز عبور" };

export default function ForgotPasswordPage() {
  return (
    <div className="container-app max-w-md py-16">
      <h1 className="text-2xl font-bold animate-fade-up">بازنشانی رمز عبور</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        ایمیل خود را وارد کنید تا لینک تعیین رمز عبور جدید برایتان ارسال شود.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
