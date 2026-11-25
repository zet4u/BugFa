import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { RegisterForm } from "@/components/app/register-form";

export const metadata: Metadata = { title: "ساخت حساب" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="container-app max-w-xl py-16">
      <h1 className="text-2xl font-bold animate-fade-up">به BugFa بپیوندید</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        باگ شکار کن، جایزه ببر و اعتبار بساز — یا برای سازمان خود برنامه اجرا کن.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        قبلاً حساب ساخته‌اید؟{" "}
        <Link href="/login" className="text-primary hover:underline">
          ورود
        </Link>
      </p>
    </div>
  );
}
