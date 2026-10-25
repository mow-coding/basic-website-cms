-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ActionResult" AS ENUM ('SUCCESS', 'DENIED', 'ERROR');

-- CreateEnum
CREATE TYPE "SitePostCategory" AS ENUM ('GENERAL', 'COUNSELING', 'GREEN_BOARD', 'RESOURCE');

-- CreateEnum
CREATE TYPE "SiteContentVisibility" AS ENUM ('PUBLIC', 'DRAFT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "result" "ActionResult" NOT NULL,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitePost" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "legacyCreatedAtUnknown" BOOLEAN NOT NULL DEFAULT false,
    "category" "SitePostCategory" NOT NULL,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibility" "SiteContentVisibility" NOT NULL DEFAULT 'DRAFT',
    "relatedLinks" JSONB,
    "attachments" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteResource" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT,
    "workshopSlug" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "visibility" "SiteContentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralSchedule" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "visibility" "SiteContentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneralSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopRun" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT,
    "workshopSlug" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "runNumber" INTEGER NOT NULL,
    "applicationFormUrl" TEXT,
    "noticePostId" TEXT,
    "description" TEXT,
    "visibility" "SiteContentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkshopRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleStage" (
    "id" TEXT NOT NULL,
    "workshopRunId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "applicationStartsAt" TIMESTAMP(3),
    "applicationEndsAt" TIMESTAMP(3),
    "applicationFormUrl" TEXT,
    "noticePostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleSession" (
    "id" TEXT NOT NULL,
    "scheduleStageId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "applicationFormUrl" TEXT,
    "noticePostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_createdAt_idx" ON "AuditLog"("resourceType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorProfile_userId_key" ON "AuthorProfile"("userId");

-- CreateIndex
CREATE INDEX "AuthorProfile_displayName_idx" ON "AuthorProfile"("displayName");

-- CreateIndex
CREATE INDEX "SitePost_category_visibility_idx" ON "SitePost"("category", "visibility");

-- CreateIndex
CREATE INDEX "SitePost_deletedAt_updatedAt_idx" ON "SitePost"("deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "SiteResource_workshopSlug_visibility_idx" ON "SiteResource"("workshopSlug", "visibility");

-- CreateIndex
CREATE INDEX "SiteResource_deletedAt_updatedAt_idx" ON "SiteResource"("deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "GeneralSchedule_visibility_date_idx" ON "GeneralSchedule"("visibility", "date");

-- CreateIndex
CREATE INDEX "GeneralSchedule_deletedAt_date_idx" ON "GeneralSchedule"("deletedAt", "date");

-- CreateIndex
CREATE INDEX "WorkshopRun_workshopSlug_visibility_idx" ON "WorkshopRun"("workshopSlug", "visibility");

-- CreateIndex
CREATE INDEX "WorkshopRun_deletedAt_year_runNumber_idx" ON "WorkshopRun"("deletedAt", "year", "runNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkshopRun_workshopSlug_year_runNumber_key" ON "WorkshopRun"("workshopSlug", "year", "runNumber");

-- CreateIndex
CREATE INDEX "ScheduleStage_workshopRunId_orderIndex_idx" ON "ScheduleStage"("workshopRunId", "orderIndex");

-- CreateIndex
CREATE INDEX "ScheduleStage_noticePostId_idx" ON "ScheduleStage"("noticePostId");

-- CreateIndex
CREATE INDEX "ScheduleSession_scheduleStageId_dayIndex_idx" ON "ScheduleSession"("scheduleStageId", "dayIndex");

-- CreateIndex
CREATE INDEX "ScheduleSession_sessionDate_idx" ON "ScheduleSession"("sessionDate");

-- CreateIndex
CREATE INDEX "ScheduleSession_noticePostId_idx" ON "ScheduleSession"("noticePostId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorProfile" ADD CONSTRAINT "AuthorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitePost" ADD CONSTRAINT "SitePost_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteResource" ADD CONSTRAINT "SiteResource_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralSchedule" ADD CONSTRAINT "GeneralSchedule_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopRun" ADD CONSTRAINT "WorkshopRun_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopRun" ADD CONSTRAINT "WorkshopRun_noticePostId_fkey" FOREIGN KEY ("noticePostId") REFERENCES "SitePost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleStage" ADD CONSTRAINT "ScheduleStage_noticePostId_fkey" FOREIGN KEY ("noticePostId") REFERENCES "SitePost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleStage" ADD CONSTRAINT "ScheduleStage_workshopRunId_fkey" FOREIGN KEY ("workshopRunId") REFERENCES "WorkshopRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSession" ADD CONSTRAINT "ScheduleSession_noticePostId_fkey" FOREIGN KEY ("noticePostId") REFERENCES "SitePost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSession" ADD CONSTRAINT "ScheduleSession_scheduleStageId_fkey" FOREIGN KEY ("scheduleStageId") REFERENCES "ScheduleStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
