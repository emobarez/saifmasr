# Non-destructive migrations (2025-10-22)

This document describes the safe, stepwise changes applied to the Neon database to support richer ServiceRequest fields and reminders without dropping legacy columns.

## Applied changes

- Added new columns to `ServiceRequest`:
  - details JSONB, attachments JSONB
  - startAt, endAt (timestamps), locationAddress, locationLat, locationLng
  - headcount, unitPrice, extraCost (default 0), totalCost
  - remindBefore24h (default false), isDraft (default false)
- Created `Reminder` table with FK to `ServiceRequest`.
- Created helpful indexes on `(isDraft, startAt)` and `(status, startAt)`.
- Backfilled legacy values:
  - locationText -> locationAddress (if target was null)
  - personnelCount -> headcount (if target was null)
  - notifyBeforeHours >= 24 -> remindBefore24h = true (when missing)
  - Aggregated `RequestAttachment` rows per request into `attachments` JSONB.
- Prepared ArmamentLevel v2 migration path:
  - Created enum `ArmamentLevel_v2` with values (NONE, SOUND_WEAPON, FIREARM)
  - Added column `ServiceRequest.armamentLevel_v2` using the new enum.
  - Backfilled from legacy `armamentLevel` mapping:
    - STANDARD -> NONE
    - ARMED -> FIREARM
    - SUPERVISOR -> NONE
    - MIXED -> SOUND_WEAPON
  - Mirrored the mapped value into `details.armamentLevel` if missing.

## Code compatibility

- API writes `armamentLevel` into `details.armamentLevel` during creation to avoid enum conflicts while migrating.
- Once ready, the codebase can be updated to write into `armamentLevel_v2` and later rename it to `armamentLevel` (with a new enum), removing the legacy enum.

## Follow-ups

- Optional: backfill `endAt` if a pair of (duration, durationUnit, startAt) exists and a consistent rule is desired.
- Update Prisma schema to model `armamentLevel_v2` explicitly (new enum), then write to it in API and UI.
- After a stable period, gradually remove legacy columns (locationText, personnelCount, notifyBeforeHours, RequestAttachment) via dedicated clean-up migrations.
