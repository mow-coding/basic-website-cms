-- Additive upgrade: existing users, author IDs, content and schedule IDs are preserved.
ALTER TABLE "User" ADD COLUMN "googleSubject" TEXT;
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");
ALTER TABLE "WorkshopRun" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
