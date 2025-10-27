-- Create new enum and column for ArmamentLevel_v2 and backfill from old enum values

-- 1) Create new enum type (will error if exists)
CREATE TYPE "ArmamentLevel_v2" AS ENUM ('NONE','SOUND_WEAPON','FIREARM');

-- 2) Add new column to ServiceRequest
ALTER TABLE "ServiceRequest" ADD COLUMN IF NOT EXISTS "armamentLevel_v2" "ArmamentLevel_v2";

-- 3) Backfill mapping from old enum to new enum
UPDATE "ServiceRequest"
SET "armamentLevel_v2" = CASE "armamentLevel"
  WHEN 'STANDARD'   THEN 'NONE'::"ArmamentLevel_v2"
  WHEN 'ARMED'      THEN 'FIREARM'::"ArmamentLevel_v2"
  WHEN 'SUPERVISOR' THEN 'NONE'::"ArmamentLevel_v2"
  WHEN 'MIXED'      THEN 'SOUND_WEAPON'::"ArmamentLevel_v2"
  ELSE NULL
END
WHERE "armamentLevel" IS NOT NULL AND "armamentLevel_v2" IS NULL;

-- 4) Mirror into details JSON if missing
UPDATE "ServiceRequest"
SET "details" = jsonb_set(
  COALESCE("details", '{}'::jsonb),
  '{armamentLevel}',
  to_jsonb(
    CASE "armamentLevel"
      WHEN 'STANDARD'   THEN 'NONE'
      WHEN 'ARMED'      THEN 'FIREARM'
      WHEN 'SUPERVISOR' THEN 'NONE'
      WHEN 'MIXED'      THEN 'SOUND_WEAPON'
      ELSE NULL
    END
  )
)
WHERE "armamentLevel" IS NOT NULL AND ("details"->>'armamentLevel') IS NULL;
