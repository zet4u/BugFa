"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Paperclip, Loader2 } from "lucide-react";

export function AttachmentUploader({ reportId }: { reportId: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("reportId", reportId);
      form.set("file", file);
      const res = await fetch("/api/attachments", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="inline-flex">
        <Button variant="outline" size="sm" asChild disabled={uploading}>
          <span>
            {uploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
            {uploading ? "Uploading…" : "Attach file"}
          </span>
        </Button>
        <input type="file" className="hidden" onChange={onChange} accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.json,.mp4,.md,.har" />
      </label>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
