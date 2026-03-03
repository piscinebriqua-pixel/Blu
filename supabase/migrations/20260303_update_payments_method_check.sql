-- Drop the existing constraint if it exists
ALTER TABLE "public"."payments" DROP CONSTRAINT IF EXISTS "payments_method_check";

-- Add the new constraint with all allowed methods including 'remise'
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_method_check" 
CHECK (method IN ('espèces', 'chèque', 'virement', 'autre', 'remise', 'remise_partenaire'));
