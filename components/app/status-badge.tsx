import { STATUS_STYLES, STATUS_LABELS } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? STATUS_STYLES.NEW
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
