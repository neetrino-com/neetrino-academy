-- AlterTable
ALTER TABLE "public"."Assignment" ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "templateId" TEXT;

-- CreateIndex
CREATE INDEX "Assignment_isTemplate_idx" ON "public"."Assignment"("isTemplate");

-- CreateIndex
CREATE INDEX "Assignment_templateId_idx" ON "public"."Assignment"("templateId");
