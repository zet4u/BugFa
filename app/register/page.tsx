import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { RegisterForm } from "@/components/app/register-form";
import { LogoMark } from "@/components/app/logo";

export const metadata: Metadata = { title: "ساخت حساب" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="animate-scale-in w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <LogoMark className="h-9 w-9" />
          <h1 className="mt-3 text-lg font-bold">ساخت حساب BugFa</h1>
        </div>
        <RegisterForm />
        <p className="mt-5 border-t pt-4 text-center text-sm text-muted-foreground">
          قبلاً حساب ساخته‌اید؟{" "}
          <Link href="/login" className="text-primary hover:underline">
            ورود
          </Link>
        </p>
      </div>
    </div>
  );
}
