"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VULN_CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";

export function SearchFilters({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "_all") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        type="search"
        placeholder="جستجوی برنامه‌ها…"
        className="sm:max-w-xs"
        defaultValue={q}
        key={q}
        onChange={(e) => {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setParam("q", e.target.value), 350);
        }}
      />
      <Select value={category || "_all"} onValueChange={(v) => setParam("category", v)}>
        <SelectTrigger className="sm:w-64" aria-label="فیلتر بر اساس دسته‌بندی">
          <SelectValue placeholder="همه دسته‌بندی‌ها" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">همه دسته‌بندی‌ها</SelectItem>
          {VULN_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {CATEGORY_LABELS[c] ?? c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sort || "_default"} onValueChange={(v) => setParam("sort", v)}>
        <SelectTrigger className="sm:w-48" aria-label="ترتیب">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_default">جدیدترین</SelectItem>
          <SelectItem value="bounty">بیشترین جایزه</SelectItem>
          <SelectItem value="name">نام</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
