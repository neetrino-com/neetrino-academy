-- CreateEnum
CREATE TYPE "public"."AttemptType" AS ENUM ('SINGLE', 'MULTIPLE');

-- AlterTable
ALTER TABLE "public"."Quiz" ADD COLUMN     "attemptType" "public"."AttemptType" NOT NULL DEFAULT 'SINGLE';
