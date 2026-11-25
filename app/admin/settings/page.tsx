import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ADMIN_NAV } from "@/components/app/admin-nav";
import { POINTS, DEFAULT_SEVERITY_REWARDS, PAGE_SIZE } from "@/lib/constants";
import { formatPoints } from "@/lib/utils";

export const metadata: Metadata = { title: "تنظیمات پلتفرم" };

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");

  const config: Record<string, string> = {
    "درایور ذخیره‌سازی": process.env.STORAGE_DRIVER === "s3" ? "سازگار با S3" : "دیسک محلی (توسعه)",
    "محدودسازی نرخ": "پنجره لغزان درون‌حافظه‌ای (ورود، ثبت‌نام، بازیابی رمز، بارگذاری)",
    "استراتژی نشست": "JWT (Auth.js v5)",
    "هش رمز عبور": "bcrypt (هزینه ۱۲)",
    "حداکثر اندازه پیوست": "۱۰ مگابایت، لیست سفید MIME و پسوند، دانلود اجباری",
    "حداکثر پیوست هر گزارش": "۵ فایل",
    "هدرهای امنیتی": "X-Frame-Options DENY، nosniff، referrer سخت‌گیرانه، permissions policy",
    "امتیاز: بحرانی": formatPoints(POINTS.CRITICAL),
    "امتیاز: بالا": formatPoints(POINTS.HIGH),
    "امتیاز: متوسط": formatPoints(POINTS.MEDIUM),
    "امتیاز: کم": formatPoints(POINTS.LOW),
    "امتیاز: اطلاعاتی": formatPoints(POINTS.INFORMATIONAL),
    "جوایز پیش‌فرض شدت (USD)": JSON.stringify(DEFAULT_SEVERITY_REWARDS),
    "تعداد در هر صفحه": formatPoints(PAGE_SIZE),
    "ارسال ایمیل": process.env.SMTP_URL ? "اتصال SMTP" : "کنسول توسعه (لینک‌ها فقط سمت سرور چاپ می‌شوند)",
  };

  return (
    <DashboardShell
      title="تنظیمات پلتفرم"
      subtitle="نمای فقط‌خواندنی از پیکربندی فعال پلتفرم"
      nav={ADMIN_NAV}
      currentPath="/admin/settings"
    >
      <div className="overflow-hidden rounded-lg border">
        <ul className="divide-y divide-border">
          {Object.entries(config).map(([k, v]) => (
            <li key={k} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">{k}</span>
              <span className="font-mono text-xs text-foreground">{v}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        پیکربندی از طریق متغیرهای محیطی (.env) کنترل می‌شود. تغییر مقادیر گیمیفیکیشن مستلزم استقرار مجدد است.
      </p>
    </DashboardShell>
  );
}
