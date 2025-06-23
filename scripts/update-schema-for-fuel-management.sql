-- Add ProjectAssignment table
CREATE TABLE IF NOT EXISTS "ProjectAssignment" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAssignment_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint for ProjectAssignment
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectAssignment_projectId_userId_key" ON "ProjectAssignment"("projectId", "userId");

-- Add foreign key constraints for ProjectAssignment
ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create FuelType enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'PETROL', 'KEROSENE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create FuelRequestStatus enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "FuelRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ISSUED', 'ACKNOWLEDGED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create FuelUrgency enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "FuelUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add FuelRequest table
CREATE TABLE IF NOT EXISTS "FuelRequest" (
    "id" SERIAL NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "requestedQuantity" DOUBLE PRECISION NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "justification" TEXT,
    "urgency" "FuelUrgency" NOT NULL DEFAULT 'MEDIUM',
    "status" "FuelRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" INTEGER,
    "approvalDate" TIMESTAMP(3),
    "approvedQuantity" DOUBLE PRECISION,
    "approvalComments" TEXT,
    "rejectionReason" TEXT,
    "issuedById" INTEGER,
    "issuanceDate" TIMESTAMP(3),
    "issuedQuantity" DOUBLE PRECISION,
    "issuanceComments" TEXT,
    "acknowledgedById" INTEGER,
    "acknowledgmentDate" TIMESTAMP(3),
    "acknowledgedQuantity" DOUBLE PRECISION,
    "acknowledgmentComments" TEXT,
    "completedById" INTEGER,
    "completionDate" TIMESTAMP(3),
    "completionComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuelRequest_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint for FuelRequest
CREATE UNIQUE INDEX IF NOT EXISTS "FuelRequest_requestNumber_key" ON "FuelRequest"("requestNumber");

-- Add foreign key constraints for FuelRequest
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "FuelRequest_status_idx" ON "FuelRequest"("status");
CREATE INDEX IF NOT EXISTS "FuelRequest_equipmentId_idx" ON "FuelRequest"("equipmentId");
CREATE INDEX IF NOT EXISTS "FuelRequest_projectId_idx" ON "FuelRequest"("projectId");
CREATE INDEX IF NOT EXISTS "FuelRequest_requestedById_idx" ON "FuelRequest"("requestedById");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

COMMENT ON TABLE "FuelRequest" IS 'Fuel requests for equipment with approval workflow';
COMMENT ON TABLE "ProjectAssignment" IS 'Assignment of users to projects with specific roles';
COMMENT ON TABLE "AuditLog" IS 'Audit trail for all system changes';
