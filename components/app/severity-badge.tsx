import { Badge } from "@/components/ui/badge";
import { SEVERITY_STYLES } from "@/lib/constants";

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
        SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.INFORMATIONAL
      }`}
    >
      {severity.charAt(0) + severity.slice(1).toLowerCase()}
    </span>
  );
}
