import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/app/site-header";
import { SiteFooter } from "@/components/app/site-footer";

export const metadata: Metadata = {
  title: {
    default: "BugFa — Bug Bounty & Vulnerability Disclosure Platform",
    template: "%s · BugFa",
  },
  description:
    "BugFa connects security researchers with organizations running bug bounty and vulnerability disclosure programs. Find bugs, submit reports, earn rewards.",
  keywords: ["bug bounty", "vulnerability disclosure", "security research", "bugfa"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
