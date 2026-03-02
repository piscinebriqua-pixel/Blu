-- Add position column to devis_items to support drag and drop ordering
ALTER TABLE "public"."devis_items" ADD COLUMN IF NOT EXISTS "position" integer DEFAULT 0;

-- Update existing items to have a sequential position based on their ID to preserve current order
WITH numbered_items AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY devis_id ORDER BY id ASC) - 1 as new_position
  FROM "public"."devis_items"
)
UPDATE "public"."devis_items"
SET "position" = numbered_items.new_position
FROM numbered_items
WHERE "public"."devis_items".id = numbered_items.id;
