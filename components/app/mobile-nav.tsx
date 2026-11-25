"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileNav({
  links,
  signedIn,
}: {
  links: { href: string; label: string }[];
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Menu">
        {open ? <X /> : <Menu />}
      </Button>
      {open ? (
        <div className="absolute left-0 right-0 top-14 border-b bg-background p-4 shadow-lg">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {!signedIn ? (
              <div className="mt-2 flex flex-col gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register" onClick={() => setOpen(false)}>Sign up</Link>
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="mt-2">
                <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
              </Button>
            )}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
