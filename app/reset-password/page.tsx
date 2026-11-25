import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/app/reset-password-form";

export const metadata: Metadata = { title: "بازنشانی رمز عبور" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="container-app max-w-md py-16">
      <h1 className="text-2xl font-bold animate-fade-up">تعیین رمز عبور جدید</h1>
      {params.token ? (
        <div className="mt-8">
          <ResetPasswordForm token={params.token} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-destructive">توکن بازنشانی یافت نشد. از لینک داخل ایمیل استفاده کنید.</p>
      )}
    </div>
  );
}
