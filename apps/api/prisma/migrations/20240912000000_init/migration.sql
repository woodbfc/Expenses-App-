CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Create enums
CREATE TYPE "ExtractedItemType" AS ENUM ('ACTION', 'PROJECT', 'RISK', 'DECISION', 'NOTE', 'PERSON', 'DEPENDENCY');
CREATE TYPE "ExtractedItemStatus" AS ENUM ('TRIAGE', 'CONFIRMED', 'DISCARDED');
CREATE TYPE "ActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETE');
CREATE TYPE "RAGStatus" AS ENUM ('RED', 'AMBER', 'GREEN');

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "UserSettings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "User"("id"),
  "priorityWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "dueSoonWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "projectValueWeight" DOUBLE PRECISION NOT NULL DEFAULT 1
);

CREATE TABLE "Dump" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "rawText" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "processedStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "Dump_userId_createdAt_idx" ON "Dump"("userId", "createdAt");

CREATE TABLE "ExtractedItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "dumpId" UUID NOT NULL REFERENCES "Dump"("id"),
  "type" "ExtractedItemType" NOT NULL,
  "rawSpan" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "status" "ExtractedItemStatus" NOT NULL DEFAULT 'TRIAGE',
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "ExtractedItem_userId_status_idx" ON "ExtractedItem"("userId", "status");

CREATE TABLE "Person" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "Person_userId_name_idx" ON "Person"("userId", "name");

CREATE TABLE "Project" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
  "rag" "RAGStatus" NOT NULL DEFAULT 'AMBER',
  "ownerId" UUID REFERENCES "Person"("id"),
  "value" DOUBLE PRECISION,
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "milestones" JSONB,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "Project_userId_rag_idx" ON "Project"("userId", "rag");
CREATE UNIQUE INDEX "Project_name_userId_key" ON "Project"("name", "userId");

CREATE TABLE "Action" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "ActionStatus" NOT NULL DEFAULT 'OPEN',
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP,
  "sourceDumpId" UUID NOT NULL REFERENCES "Dump"("id"),
  "projectId" UUID REFERENCES "Project"("id"),
  "ownerId" UUID REFERENCES "Person"("id"),
  "waitingOnPersonId" UUID REFERENCES "Person"("id"),
  "blockedByActionId" UUID REFERENCES "Action"("id"),
  "effort" TEXT,
  "valueImpact" DOUBLE PRECISION,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "Action_userId_status_idx" ON "Action"("userId", "status");
CREATE INDEX "Action_dueDate_idx" ON "Action"("dueDate");

CREATE TABLE "ProjectStakeholder" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "Project"("id"),
  "personId" UUID NOT NULL REFERENCES "Person"("id"),
  UNIQUE("projectId", "personId")
);

CREATE TABLE "Risk" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "projectId" UUID REFERENCES "Project"("id"),
  "actionId" UUID REFERENCES "Action"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "Risk_userId_status_idx" ON "Risk"("userId", "status");

CREATE TABLE "Decision" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Note" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "content" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Tag" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE
);

CREATE TABLE "ActionTag" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actionId" UUID NOT NULL REFERENCES "Action"("id"),
  "tagId" UUID NOT NULL REFERENCES "Tag"("id"),
  UNIQUE("actionId", "tagId")
);

CREATE TABLE "ProjectTag" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "Project"("id"),
  "tagId" UUID NOT NULL REFERENCES "Tag"("id"),
  UNIQUE("projectId", "tagId")
);

CREATE TABLE "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "entity" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
