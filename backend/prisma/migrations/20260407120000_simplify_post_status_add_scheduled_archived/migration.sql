-- Migrate PostStatus: drop PENDING/REJECTED, add SCHEDULED/ARCHIVED
-- Map PENDING -> DRAFT, REJECTED -> ARCHIVED

CREATE TYPE "PostStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

ALTER TABLE "posts" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "posts" ALTER COLUMN "status" TYPE "PostStatus_new" USING (
  CASE "status"::text
    WHEN 'PENDING' THEN 'DRAFT'::"PostStatus_new"
    WHEN 'REJECTED' THEN 'ARCHIVED'::"PostStatus_new"
    WHEN 'DRAFT' THEN 'DRAFT'::"PostStatus_new"
    WHEN 'PUBLISHED' THEN 'PUBLISHED'::"PostStatus_new"
    ELSE 'DRAFT'::"PostStatus_new"
  END
);

ALTER TABLE "posts" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"PostStatus_new";

DROP TYPE "PostStatus";

ALTER TYPE "PostStatus_new" RENAME TO "PostStatus";

-- New columns
ALTER TABLE "posts" ADD COLUMN "scheduledAt" TIMESTAMP(3);
ALTER TABLE "posts" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "posts_status_scheduledAt_idx" ON "posts"("status", "scheduledAt");
