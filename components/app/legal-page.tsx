import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="container-app max-w-3xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:mr-5 [&_li]:list-disc [&_p]:mb-3">
        {children}
      </div>
    </div>
  );
}
