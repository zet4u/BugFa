import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LegalPage } from "@/components/app/legal-page";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <LegalPage title="About BugFa">
      <p>
        BugFa is a bug bounty and vulnerability disclosure platform built on a simple premise:
        security research works best when the rules are clear, the rewards are fair, and both sides
        are held to the same standard of professionalism.
      </p>

      <h2>What BugFa does</h2>
      <p>
        Organizations publish programs that describe their assets, rules, and bounty tables.
        Security researchers test those assets within scope, submit structured vulnerability reports,
        and work with the organization through a private discussion until the issue is resolved and —
        where applicable — rewarded.
      </p>

      <h2>How reputation works</h2>
      <p>
        Every accepted report earns reputation points scaled by severity. Points contribute to your
        global ranking, unlock achievements, and appear on your public researcher profile. Only
        accepted findings count — quantity never beats quality.
      </p>

      <h2>Our commitment</h2>
      <ul>
        <li>Coordinated disclosure is the default. Researchers and organizations agree on timelines.</li>
        <li>Private reports remain private. Access is strictly limited to the researcher and the program team.</li>
        <li>Disputes are handled by BugFa staff with a documented resolution and audit trail.</li>
      </ul>

      <h2>Get started</h2>
      <p>
        <Button asChild variant="outline" size="sm">
          <Link href="/explore">Explore live programs</Link>
        </Button>
        {" "}
        <Button asChild variant="outline" size="sm" className="ml-2">
          <Link href="/register">Create an account</Link>
        </Button>
      </p>
    </LegalPage>
  );
}
