-- AlterTable
ALTER TABLE "public"."GroupSchedule" ADD COLUMN     "type" "public"."EventType" NOT NULL DEFAULT 'LESSON';
