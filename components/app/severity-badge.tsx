import { SEVERITY_STYLES, SEVERITY_LABELS } from "@/lib/constants";

export function SeverityBadge({ severity }: { severity: string }) {
  const sev = severity as keyof typeof SEVERITY_LABELS;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
        SEVERITY_STYLES[sev] ?? SEVERITY_STYLES.INFORMATIONAL
      }`}
    >
      {SEVERITY_LABELS[sev] ?? severity}
    </span>
  );
}
