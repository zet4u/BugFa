import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]+/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function formatMoney(amount: number | null | undefined, currency = "USD") {
  if (amount == null) return "—";
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  const formatted = new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${symbol}${formatted}`;
}

export function formatPoints(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "چند لحظه پیش";
  if (mins < 60) return `${new Intl.NumberFormat("fa-IR").format(mins)} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${new Intl.NumberFormat("fa-IR").format(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${new Intl.NumberFormat("fa-IR").format(days)} روز پیش`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${new Intl.NumberFormat("fa-IR").format(months)} ماه پیش`;
  return `${new Intl.NumberFormat("fa-IR").format(Math.floor(months / 12))} سال پیش`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
