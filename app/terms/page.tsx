import type { Metadata } from "next";
import { LegalPage } from "@/components/app/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p className="text-xs">Last updated: January 2025</p>

      <h2>1. Acceptance</h2>
      <p>
        By creating a BugFa account you agree to these terms. BugFa is a platform for coordinated
        vulnerability disclosure and bug bounty. You may use it only for lawful security research that
        respects the scope and rules of each program.
      </p>

      <h2>2. Accounts</h2>
      <p>
        You are responsible for your account credentials. One primary account per person.
        Providing false identity information or evading platform bans may result in permanent removal.
      </p>

      <h2>3. Rules of engagement</h2>
      <ul>
        <li>Only test assets listed in a program's scope.</li>
        <li>Never exfiltrate, destroy, or modify data that is not yours.</li>
        <li>Never use automated scanners against out-of-scope targets.</li>
        <li>Do not demand payment or disclosure outside the program's stated policy.</li>
      </ul>

      <h2>4. Reports and rewards</h2>
      <p>
        Submission of a report grants the organization a license to validate and remediate it.
        Recognition and any monetary reward are governed by each program's reward table. BugFa
        facilitates but does not itself guarantee payment; verified organizations are expected to pay
        accepted bounty-eligible reports in a timely manner.
      </p>

      <h2>5. Marketplace discretion</h2>
      <p>
        BugFa may pause programs, reject malicious or abusive reports, ban accounts, and resolve
        disputes between researchers and organizations. Our decisions aim to be proportionate,
        documented, and auditable.
      </p>

      <h2>6. Termination</h2>
      <p>
        You may delete your account at any time. We may suspend or terminate accounts for rule
        violations, fraud, or legal compliance reasons. Sections concerning records and audit logs
        survive termination.
      </p>

      <h2>7. Liability</h2>
      <p>
        The platform is provided "as is" without warranties. To the maximum extent permitted by law,
        BugFa is not liable for indirect or consequential damages.
      </p>
    </LegalPage>
  );
}
