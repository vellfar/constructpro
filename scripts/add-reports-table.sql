-- Add Reports table to store generated reports
CREATE TABLE IF NOT EXISTS "Report" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "parameters" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "generatedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "Report" ADD CONSTRAINT "Report_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create index for better performance
CREATE INDEX "Report_generatedBy_idx" ON "Report"("generatedBy");
CREATE INDEX "Report_type_idx" ON "Report"("type");
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");
