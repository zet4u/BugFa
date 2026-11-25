import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/app/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="container-app max-w-md py-16">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Enter your email and we will send a link to set a new password.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
