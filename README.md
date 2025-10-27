# SaifMasr Platform (Security Service Portal)

Unified Next.js 15 (App Router) application providing client & admin workflows for security services (حراسة شخصية, تأمين فعاليات, وغيرها).

## Key Features

- Authentication with NextAuth (credentials) & optional TOTP 2FA.
- Services catalog with duration field & admin CRUD.
- Service Requests (supports Bodyguard / حراسة شخصية advanced fields):
  - Draft vs Submitted lifecycle.
  - Extended operational fields: personnelCount, durationUnit, start/end schedule, location text + coordinates, armamentLevel, notes, notifyBeforeHours.
  - Attachments (local file uploads) and reminder scheduling.
- Admin dashboard with filtering (status, armament, draft/submitted, date window, service name) and map link.
- Reminder job endpoint to trigger upcoming request notifications.

## Tech Stack

| Area | Tech |
|------|------|
| Framework | Next.js 15 (App Router) |
| Auth | NextAuth + Prisma adapter |
| ORM / DB | Prisma + PostgreSQL (Neon) + raw SQL fallbacks |
| Styling | Tailwind CSS + shadcn/ui (Radix) |
| Charts | Recharts |
| Maps | Leaflet (react-leaflet via dynamic import) |
| AI (optional) | Genkit (present in repo) |

## Environment

Copy `env.example` to `.env.local` and fill required keys (DB URLs, NEXTAUTH secrets, etc.).

## Database Schema Extensions (Bodyguard Flow)

Added columns to `ServiceRequest` (applied idempotently at runtime if migrations blocked):

```sql
personnelCount       INT
durationUnit         ENUM('HOURS','DAYS')
startAt              TIMESTAMP
endAt                TIMESTAMP
locationText         TEXT
locationLat          DOUBLE PRECISION
locationLng          DOUBLE PRECISION
armamentLevel        ENUM('STANDARD','ARMED','SUPERVISOR','MIXED')
notes                TEXT
notifyBeforeHours    INT DEFAULT 24
isDraft              BOOLEAN DEFAULT false
lastReminderAt       TIMESTAMP
```

Attachments table:

```sql
RequestAttachment(id TEXT PK, requestId FK, url TEXT, name TEXT, mimeType TEXT, createdAt TIMESTAMP)
```

## Service Request Lifecycle

1. Client creates a draft (isDraft = true). Editable by the same client only.
2. Client edits draft (can update all extended fields & attachments).
3. Client submits (isDraft -> false, status becomes PENDING).
4. Admin processes: PENDING → IN_PROGRESS → COMPLETED or CANCELLED.
5. Completion auto-creates invoice if service has a price.

## Endpoints Overview (Relevant)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/service-requests` | Create draft or submitted request (client or admin) |
| GET  | `/api/service-requests?extended=1&armamentLevel=...&draft=...` | Filtered list w/ extended fields |
| GET  | `/api/service-requests/[id]` | Single request (auth; owner or admin) |
| PATCH| `/api/service-requests/[id]` | Admin full update or client draft edit |
| POST | `/api/uploads` | Authenticated file upload (local dev storage) |
| GET  | `/api/jobs/reminders/run` | Trigger reminder evaluation (admin/cron) |

### Uploads

Stored under `public/uploads/YYYY/MM/`. On Vercel, this is ephemeral—replace with S3/UploadThing for production durability.

### Reminders Job

`GET /api/jobs/reminders/run` (pure Prisma filtering) selects upcoming non-draft requests whose `startAt` falls within the next `notifyBeforeHours` horizon and haven't been reminded in the last 6h (dedupe window). It sets `lastReminderAt` and logs activity. Supporting indexes added on `startAt`, `(status,startAt)`, and `(isDraft,startAt)` for efficiency.

### Activity Logging

`src/lib/activityLogger.ts` normalizes actions into CREATE/UPDATE/DELETE/etc. Reminder executions log as INFO with contextual metadata.

## Map Integration

Leaflet map picker (`MapPicker.tsx`) is dynamically imported to avoid SSR issues:

- Click or drag marker to set lat/lng.
- Fallback: manual coordinate fields + browser geolocation button.

## QA Smoke Script

Run automated end-to-end test (assumes dev server on port 9002):

```bash
npm run qa:smoke
```

Environment (optional):

```bash
QA_USER_EMAIL=client@example.com QA_USER_PASSWORD=yourpass npm run qa:smoke
```

Outputs JSON summarizing each step (draft creation, edit, submit, attachment request, reminder run).

## Internationalization / Arabic UX Notes

- RTL-friendly layout (Tailwind direction handled at root CSS).
- Key Arabic labels for statuses & priority (e.g., معلقة, جاري التنفيذ, مكتمل, ملغي).
- Armament levels displayed verbatim; adapt to localized labels if required.
- Ensure date/time formatting uses `ar-EG` locale where presented.

## Known Work In Progress

| Item | Status | Notes |
|------|--------|-------|
| Prisma Windows EPERM | Resolved | Prisma client now generates; raw SQL fallbacks removed from main routes |
| Baseline migration committed | New | `prisma/migrations/baseline_init` created via `prisma migrate diff` |
| Durable uploads | Pending | Replace local FS with persistent storage provider |
| Telemetry expansion | Pending | Need richer activity log events & tracing |

## Arabic Quick Start (ملخص سريع بالعربية)

1. انسخ ملف البيئة: `cp env.example .env.local` ثم حدّث القيم.
2. شغّل الخادم: `npm run dev` على المنفذ 9002.
3. ادخل كعميل وأنشئ "طلب حارس شخصي" كمسودة ثم أرسله.
4. راقب الطلب من لوحة التحكم الإدارية وجرّب الفلاتر الجديدة (تسليح، مسودة، التاريخ...).
5. شغّل مهمة التذكير: افتح `/api/jobs/reminders/run` (أو استخدم cron خارجي).

## Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next dev server (port 9002) |
| `npm run build` | Prisma generate + Next build |
| `npm run qa:smoke` | Automated smoke of request lifecycle |
| `npm run seed:services` | Seed base services catalog |

## Migrations

The current schema has been captured into a baseline migration at `prisma/migrations/baseline_init/migration.sql` using:

```bash
prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/baseline_init/migration.sql
```

Going forward, create changes by editing `prisma/schema.prisma` then running:

```bash
npx prisma migrate dev --name <change_name>
```

In CI/production deploy environments use:

```bash
npx prisma migrate deploy
```

Remove any leftover raw DDL in API routes (already done for service requests) to keep schema evolution centralized in migrations.

## Security & Hardening TODOs

- Enforce stricter auth on reminder job (shared secret or admin-only check without bypass).
- Replace credential login direct POST in QA script with genuine CSRF token retrieval.
- Implement rate limiting on uploads & service requests.

---
For deeper feature docs see `docs/` and API source files under `src/app/api/`.
