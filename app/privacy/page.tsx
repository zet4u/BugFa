import type { Metadata } from "next";
import { LegalPage } from "@/components/app/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p className="text-xs">Last updated: January 2025</p>

      <h2>Data we collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, username, email, and a bcrypt-hashed password.</li>
        <li><strong>Profile data:</strong> optional bio, country, and links you choose to publish.</li>
        <li><strong>Platform activity:</strong> submissions, comments, rewards, and achievements.</li>
        <li><strong>Security logs:</strong> IP address and action metadata for audit logging.</li>
      </ul>

      <h2>How we use it</h2>
      <p>
        Data is used to operate the platform: authenticating you, showing your track record, routing
        notifications, detecting abuse, and paying rewards. Audit logs are retained for security and
        dispute resolution.
      </p>

      <h2>What is public</h2>
      <p>
        Your public researcher profile (username, points, accepted report statistics, achievements)
        is visible to other users. Report content is private between you and the program team —
        never publicly indexed, accessible only with explicit authorization.
      </p>

      <h2>Cookies</h2>
      <p>
        We set a single session cookie (httpOnly, Secure, SameSite=Lax) to keep you logged in.
        No third-party advertising or tracking cookies are used.
      </p>

      <h2>Your rights</h2>
      <p>
        You may correct or delete personal data from your profile settings. For data export or
        erasure requests, contact the BugFa team through the platform. We honor deletion requests
        except where records must be retained for legal or security purposes.
      </p>
    </LegalPage>
  );
}
