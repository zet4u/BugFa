import type { Metadata } from "next";
import "vazirmatn/Vazirmatn-Variable-font-face.css";
import "./globals.css";
import { SiteHeader } from "@/components/app/site-header";
import { SiteFooter } from "@/components/app/site-footer";

export const metadata: Metadata = {
  title: {
    default: "BugFa — پلتفرم باگ بانتی و افشای آسیب‌پذیری",
    template: "%s · BugFa",
  },
  description:
    "BugFa پژوهشگران امنیتی را با سازمان‌هایی که برنامه باگ بانتی و افشای آسیب‌پذیری دارند متصل می‌کند. باگ پیدا کن، گزارش بده، جایزه بگیر.",
  keywords: ["باگ بانتی", "افشای آسیب‌پذیری", "امنیت سایبری", "bugfa", "bug bounty"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
