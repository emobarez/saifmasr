-- Non-destructive migration for Neon (PostgreSQL)
-- Adds new columns to ServiceRequest and creates Reminder table without dropping legacy columns or enums.

-- 1) ServiceRequest columns
ALTER TABLE "ServiceRequest"
  ADD COLUMN IF NOT EXISTS "details" JSONB,
  ADD COLUMN IF NOT EXISTS "attachments" JSONB,
  ADD COLUMN IF NOT EXISTS "startAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "endAt"   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "locationAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "locationLat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "locationLng" DOUBLE PRECISION,
  -- To avoid enum conflicts, keep this as TEXT for now
  ADD COLUMN IF NOT EXISTS "armamentLevel" TEXT,
  ADD COLUMN IF NOT EXISTS "headcount" INTEGER,
  ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "extraCost" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalCost" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "remindBefore24h" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "isDraft" BOOLEAN DEFAULT FALSE;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS "ServiceRequest_isDraft_startAt_idx" ON "ServiceRequest" ("isDraft", "startAt");
CREATE INDEX IF NOT EXISTS "ServiceRequest_status_startAt_idx" ON "ServiceRequest" ("status", "startAt");

-- 2) Reminder table
CREATE TABLE IF NOT EXISTS "Reminder" (
  "id" TEXT PRIMARY KEY,
  "serviceRequestId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'FOLLOW_UP_24H',
  "dueAt" TIMESTAMPTZ NOT NULL,
  "sentAt" TIMESTAMPTZ,
  "channel" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Reminder_serviceRequestId_fkey"
    FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE
);
