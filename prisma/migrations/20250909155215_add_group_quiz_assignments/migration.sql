-- CreateTable
CREATE TABLE "public"."GroupQuizAssignment" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupQuizAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupQuizAssignment_groupId_quizId_key" ON "public"."GroupQuizAssignment"("groupId", "quizId");

-- AddForeignKey
ALTER TABLE "public"."GroupQuizAssignment" ADD CONSTRAINT "GroupQuizAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupQuizAssignment" ADD CONSTRAINT "GroupQuizAssignment_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "public"."Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
