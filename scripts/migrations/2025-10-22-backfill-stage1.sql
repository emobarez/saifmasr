-- Backfill stage 1: copy legacy fields into new columns safely

-- 1) locationText -> locationAddress
UPDATE "ServiceRequest"
SET "locationAddress" = COALESCE("locationAddress", "locationText")
WHERE "locationText" IS NOT NULL AND ("locationAddress" IS NULL OR "locationAddress" = '');

-- 2) personnelCount -> headcount
UPDATE "ServiceRequest"
SET "headcount" = COALESCE("headcount", "personnelCount")
WHERE "personnelCount" IS NOT NULL AND "headcount" IS NULL;

-- 3) notifyBeforeHours >= 24 -> remindBefore24h = true
UPDATE "ServiceRequest"
SET "remindBefore24h" = TRUE
WHERE "notifyBeforeHours" IS NOT NULL AND "notifyBeforeHours" >= 24 AND ("remindBefore24h" IS NULL OR "remindBefore24h" = FALSE);

-- 4) Aggregate RequestAttachment -> attachments JSONB
WITH agg AS (
  SELECT "requestId" AS id,
         jsonb_agg(jsonb_build_object('url', url, 'name', name, 'type', "mimeType")) AS files
  FROM "RequestAttachment"
  GROUP BY "requestId"
)
UPDATE "ServiceRequest" sr
SET attachments = COALESCE(sr.attachments, agg.files)
FROM agg
WHERE sr.id = agg.id AND (sr.attachments IS NULL OR jsonb_typeof(sr.attachments) <> 'array' OR jsonb_array_length(sr.attachments) = 0);
