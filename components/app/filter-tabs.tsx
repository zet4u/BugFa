import Link from "next/link";

export function FilterTabs({
  basePath,
  current,
  options,
  extraParams = {},
}: {
  basePath: string;
  current: string;
  options: { value: string; label: string }[];
  extraParams?: Record<string, string>;
}) {
  const buildHref = (value: string) => {
    const params = new URLSearchParams(extraParams);
    if (value && value !== "ALL" && value !== "_default") params.set("status", value);
    else params.delete("status");
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const active = current === opt.value;
        return (
          <Link
            key={opt.value}
            href={buildHref(opt.value)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
