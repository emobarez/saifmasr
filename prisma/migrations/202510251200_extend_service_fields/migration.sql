-- Extend service presentation fields
ALTER TABLE "Service"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "icon" TEXT,
  ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "features" JSONB,
  ADD COLUMN "ctaLabel" TEXT,
  ADD COLUMN "ctaUrl" TEXT;

-- Populate slug values for existing services (append hashed suffix to ensure uniqueness)
UPDATE "Service"
SET "slug" = CASE
  WHEN COALESCE(TRIM("name"), '') = '' THEN 'service-' || SUBSTR(MD5(id::text), 1, 8)
  ELSE LOWER(REGEXP_REPLACE(TRIM(BOTH '-' FROM REGEXP_REPLACE("name", '\\s+', '-', 'g')), '[^0-9a-zأ-ي-]+', '-', 'gi')) || '-' || SUBSTR(MD5(id::text), 1, 4)
END
WHERE "slug" IS NULL OR "slug" = '';

-- Finalize slug column constraints
ALTER TABLE "Service"
  ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
