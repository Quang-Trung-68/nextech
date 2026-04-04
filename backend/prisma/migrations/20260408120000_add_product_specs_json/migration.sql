-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "specsJson" JSONB;
