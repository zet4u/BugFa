# BugFa

A production-ready bug bounty and vulnerability disclosure platform connecting security researchers, organizations, and platform administrators. Built with Next.js 15 (App Router, TypeScript, Server Actions), PostgreSQL + Prisma, and Auth.js v5.

## Features

### Public
- Landing page with live platform statistics
- Explore programs with search, category filter, sorting, and pagination
- Program detail pages (scope, out-of-scope, reward table, rules, disclosure policy, safe harbor)
- Leaderboard, Hall of Fame, and public researcher profiles
- About, Terms, Privacy

### Researcher dashboard
- Overview with stats, points, level, and recent submissions
- Submissions list with status filters and pagination
- Full report detail view with private discussion and dispute filing
- Available programs, bookmarks, earnings/reward history, achievements
- Profile settings (name, username, bio, country, links), password change, email verification

### Organization dashboard
- Overview with triage queue and pipeline stats
- Create/edit programs via a dynamic form (scope rows, categories, severity rewards, prohibited activities)
- Manage programs with status transitions (Draft / Public / Private / Paused)
- Review reports, change status (+reward, internal notes), private discussion
- Organization profile and team management (invite / accept / remove members)

### Admin dashboard
- Platform statistics and report pipeline
- User management (search, ban/unban, role changes)
- Organization verification
- Program moderation
- Report oversight (admins can triage any report)
- Dispute management with resolutions
- Audit logs
- Read-only platform settings view

## Architecture

```
app/                     Next.js App Router (server components + server actions)
  api/auth/[...nextauth] Auth.js handlers
  api/attachments        Upload (POST) and authenticated download (GET)
  programs/[slug]        Public program pages + submit
  researcher/ org/ admin/ dashboard/   Role-scoped dashboards
components/ui            shadcn-style primitives (Radix + Tailwind)
components/app           Domain components (program card, report view, forms…)
lib/
  auth.ts                Auth.js v5 (JWT sessions, credentials, role in token)
  session.ts             requireUser / requireRole / getSession helpers
  prisma.ts              Prisma client singleton
  validation.ts          Zod schemas (server-only)
  storage.ts             Storage abstraction: local disk | S3-compatible
  rate-limit.ts          In-memory sliding-window rate limiter
  audit.ts               Audit logging + hashed auth tokens
  notifications.ts       DB notifications
  gamification.ts        Points + achievement engine
  actions/               Server actions per domain (auth, reports, programs…)
prisma/schema.prisma     Full data model (14 models, enums, indexes)
scripts/db               Embedded-postgres up/down (local dev only)
prisma/seed.ts           Realistic seed data
middleware.ts            JWT role gate for /researcher, /org, /admin, /dashboard
```

## Getting started

Requirements: Node 20+.

```bash
npm install

# Option A: embedded postgres (sandbox/dev, loopback-only on :54329)
npm run db:start
npm run db:migrate   # prisma migrate dev
npm run db:seed

# Option B: your own PostgreSQL
# set DATABASE_URL in .env, then:
npx prisma migrate dev && npm run db:seed

npm run dev
```

### Environment

Copy `.env.example` to `.env`. Keys:

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Auth.js secret (required in production)
- `AUTH_URL` — base URL of the deployment
- `STORAGE_DRIVER` — `local` (writes to `storage/uploads`) or `s3` with `S3_*` keys

## Seed accounts

All seeded accounts use the password `Hunt3r!2024` (change in production):

| Role        | Email               | Notes |
|-------------|---------------------|-------|
| Admin       | admin@bugfa.dev     | full admin dashboard |
| Org owner   | sec@nebulacdn.io    | Nebula CDN (verified) |
| Org owner   | security@vaultpay.eu| VaultPay (verified) |
| Org owner   | sec@driftmail.com   | DriftMail (unverified, pending review) |
| Researchers | lena@hunt.dev, tomas@hunt.dev, yuki@hunt.dev, omer@hunt.dev, sara@hunt.dev, darek@hunt.dev | with submissions, points, and achievements |

## Security

- Role-based access control enforced in middleware **and** re-checked server-side in every action/page
- Strict object-level authorization (IDOR-safe): reports, attachments, programs, org profiles all verify ownership/membership
- Zod validation on every mutation, bcrypt (cost 12) password hashing
- JWT sessions (HttpOnly, SameSite) with role claims; banned accounts lose access immediately (session helper re-checks `forbidden`)
- Email verification and password-reset tokens stored SHA-256-hashed with expiry and single use
- Rate limiting on login, register, reset, and uploads
- Uploads: MIME/extension allowlist (10 MB max), randomized storage keys, forced `Content-Disposition: attachment`, auth-checked download route — PoC files are never served inline
- Spam-safe uploads: private attachments validate reporter/org membership before storage
- Audit logging for all privileged actions
- Security headers (frame-deny, nosniff, referrer policy, permissions policy), `poweredByHeader` off
- Private programs: not listed publicly, details and even the title are withheld behind a lock screen
- Secrets only ever stored in `.env` / server-only modules

## Disclosure & gamification

- Points per accepted severity: Critical 100 / High 60 / Medium 30 / Low 10 / Info 2
- 11 achievement badges (first accept, critical striker, bounty earned, first blood, …)
- Leaderboard ranks researchers by accepted-report points; Hall of Fame lists all credited researchers
- Researchers can dispute rejections; admins resolve with outcome + written rationale
