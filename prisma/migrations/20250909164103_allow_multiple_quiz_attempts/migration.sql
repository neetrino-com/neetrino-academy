-- DropIndex
DROP INDEX "public"."QuizAttempt_userId_quizId_key";

-- AlterTable
ALTER TABLE "public"."QuizAttempt" ADD COLUMN     "assignmentId" TEXT;

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_quizId_idx" ON "public"."QuizAttempt"("userId", "quizId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_assignmentId_idx" ON "public"."QuizAttempt"("userId", "assignmentId");
