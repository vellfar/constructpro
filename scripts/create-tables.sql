-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types first
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ActivityStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED');
CREATE TYPE "OwnershipType" AS ENUM ('OWNED', 'RENTED', 'LEASED');
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIONAL', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'RESERVED');
CREATE TYPE "FunctionalityType" AS ENUM ('FULLY_FUNCTIONAL', 'PARTIALLY_FUNCTIONAL', 'NON_FUNCTIONAL');
CREATE TYPE "ConditionType" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL');
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'PETROL', 'KEROSENE');
CREATE TYPE "FuelRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ISSUED', 'CANCELLED');
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- Create tables in dependency order

-- Roles table
CREATE TABLE IF NOT EXISTS "Role" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS "Permission" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission junction table
CREATE TABLE IF NOT EXISTS "_PermissionToRole" (
    "A" INTEGER REFERENCES "Permission"("id") ON DELETE CASCADE,
    "B" INTEGER REFERENCES "Role"("id") ON DELETE CASCADE,
    PRIMARY KEY ("A", "B")
);

-- Employees table
CREATE TABLE IF NOT EXISTS "Employee" (
    "id" SERIAL PRIMARY KEY,
    "employeeNumber" VARCHAR(255) UNIQUE NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "dateOfAppointment" TIMESTAMP NOT NULL,
    "section" VARCHAR(255) NOT NULL,
    "designation" VARCHAR(255) NOT NULL,
    "wageAmount" DECIMAL(10,2) NOT NULL,
    "wageFrequency" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(50) NOT NULL,
    "bank" VARCHAR(255),
    "accountNumber" VARCHAR(255),
    "bankBranch" VARCHAR(255),
    "employmentTerms" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "username" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(255),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "roleId" INTEGER NOT NULL REFERENCES "Role"("id"),
    "employeeId" INTEGER UNIQUE REFERENCES "Employee"("id")
);

-- Clients table
CREATE TABLE IF NOT EXISTS "Client" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "contactName" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(255),
    "address" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS "Project" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(255),
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP,
    "budget" DECIMAL(15,2) NOT NULL,
    "status" "ProjectStatus" DEFAULT 'ACTIVE',
    "projectCode" VARCHAR(255) UNIQUE NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "clientId" INTEGER REFERENCES "Client"("id")
);

-- Project Assignments table
CREATE TABLE IF NOT EXISTS "ProjectAssignment" (
    "id" SERIAL PRIMARY KEY,
    "projectId" INTEGER NOT NULL REFERENCES "Project"("id"),
    "userId" INTEGER NOT NULL REFERENCES "User"("id"),
    "role" VARCHAR(255) NOT NULL,
    "startDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("projectId", "userId")
);

-- Activities table
CREATE TABLE IF NOT EXISTS "Activity" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "projectId" INTEGER NOT NULL REFERENCES "Project"("id"),
    "employeeId" INTEGER REFERENCES "Employee"("id"),
    "startDate" TIMESTAMP,
    "endDate" TIMESTAMP,
    "status" "ActivityStatus" DEFAULT 'PLANNED',
    "totalCost" DECIMAL(15,2) DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Measurements table
CREATE TABLE IF NOT EXISTS "ActivityMeasurement" (
    "id" SERIAL PRIMARY KEY,
    "activityId" INTEGER NOT NULL REFERENCES "Activity"("id"),
    "billItem" INTEGER NOT NULL,
    "itemDescription" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(100) NOT NULL,
    "section" VARCHAR(255) NOT NULL,
    "measuredDate" TIMESTAMP NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Estimates table
CREATE TABLE IF NOT EXISTS "ActivityEstimate" (
    "id" SERIAL PRIMARY KEY,
    "activityId" INTEGER NOT NULL REFERENCES "Activity"("id"),
    "itemNo" INTEGER NOT NULL,
    "itemDescription" VARCHAR(255) NOT NULL,
    "majorActivity" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(100) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Equipment Budget table
CREATE TABLE IF NOT EXISTS "ActivityEquipmentBudget" (
    "id" SERIAL PRIMARY KEY,
    "activityId" INTEGER NOT NULL REFERENCES "Activity"("id"),
    "itemNo" INTEGER NOT NULL,
    "itemDescription" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(100) NOT NULL,
    "resourceName" VARCHAR(255) NOT NULL,
    "unitOutput" DECIMAL(10,2) NOT NULL,
    "daysPerUnit" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Labor Budget table
CREATE TABLE IF NOT EXISTS "ActivityLaborBudget" (
    "id" SERIAL PRIMARY KEY,
    "activityId" INTEGER NOT NULL REFERENCES "Activity"("id"),
    "itemNo" INTEGER NOT NULL,
    "itemDescription" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(100) NOT NULL,
    "resourceName" VARCHAR(255) NOT NULL,
    "unitOutput" DECIMAL(10,2) NOT NULL,
    "daysPerUnit" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Material Budget table
CREATE TABLE IF NOT EXISTS "ActivityMaterialBudget" (
    "id" SERIAL PRIMARY KEY,
    "activityId" INTEGER NOT NULL REFERENCES "Activity"("id"),
    "itemNo" INTEGER NOT NULL,
    "itemDescription" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(100) NOT NULL,
    "resourceName" VARCHAR(255) NOT NULL,
    "unitOutput" DECIMAL(10,2) NOT NULL,
    "daysPerUnit" DECIMAL(10,2) NOT NULL,
    "budgetCode" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment table
CREATE TABLE IF NOT EXISTS "Equipment" (
    "id" SERIAL PRIMARY KEY,
    "equipmentCode" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "make" VARCHAR(255) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "yearOfManufacture" INTEGER,
    "ownership" "OwnershipType" NOT NULL,
    "measurementType" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(100) NOT NULL,
    "size" DECIMAL(10,2),
    "workMeasure" VARCHAR(255) NOT NULL,
    "acquisitionCost" DECIMAL(15,2),
    "supplier" VARCHAR(255),
    "dateReceived" TIMESTAMP,
    "status" "EquipmentStatus" DEFAULT 'OPERATIONAL',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Assessment table
CREATE TABLE IF NOT EXISTS "EquipmentAssessment" (
    "id" SERIAL PRIMARY KEY,
    "equipmentId" INTEGER NOT NULL REFERENCES "Equipment"("id"),
    "functionality" "FunctionalityType" NOT NULL,
    "condition" "ConditionType" NOT NULL,
    "insurance" BOOLEAN NOT NULL,
    "assessmentDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "assessedBy" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Location table
CREATE TABLE IF NOT EXISTS "EquipmentLocation" (
    "id" SERIAL PRIMARY KEY,
    "equipmentId" INTEGER NOT NULL REFERENCES "Equipment"("id"),
    "currentLocation" VARCHAR(255) NOT NULL,
    "dateMoved" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "officer" VARCHAR(255) NOT NULL,
    "authorizingOfficer" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Assignment table
CREATE TABLE IF NOT EXISTS "EquipmentAssignment" (
    "id" SERIAL PRIMARY KEY,
    "equipmentId" INTEGER NOT NULL REFERENCES "Equipment"("id"),
    "projectId" INTEGER NOT NULL REFERENCES "Project"("id"),
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP,
    "assignedBy" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fuel Request table
CREATE TABLE IF NOT EXISTS "FuelRequest" (
    "id" SERIAL PRIMARY KEY,
    "requestNumber" VARCHAR(255) UNIQUE NOT NULL,
    "equipmentId" INTEGER NOT NULL REFERENCES "Equipment"("id"),
    "projectId" INTEGER NOT NULL REFERENCES "Project"("id"),
    "fuelType" "FuelType" NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "requestedById" INTEGER NOT NULL REFERENCES "User"("id"),
    "requestDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "justification" TEXT,
    "status" "FuelRequestStatus" DEFAULT 'PENDING',
    "approvedById" INTEGER REFERENCES "User"("id"),
    "approvalDate" TIMESTAMP,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fuel Issuance table
CREATE TABLE IF NOT EXISTS "FuelIssuance" (
    "id" SERIAL PRIMARY KEY,
    "issueNumber" VARCHAR(255) UNIQUE NOT NULL,
    "requestId" INTEGER NOT NULL REFERENCES "FuelRequest"("id"),
    "quantity" DECIMAL(10,2) NOT NULL,
    "issuedById" INTEGER NOT NULL REFERENCES "User"("id"),
    "issueDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "fuelStation" VARCHAR(255),
    "odometerReading" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fuel Consumption table
CREATE TABLE IF NOT EXISTS "FuelConsumption" (
    "id" SERIAL PRIMARY KEY,
    "equipmentId" INTEGER NOT NULL REFERENCES "Equipment"("id"),
    "issuanceId" INTEGER NOT NULL REFERENCES "FuelIssuance"("id"),
    "activityDescription" TEXT,
    "consumptionDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "quantityUsed" DECIMAL(10,2) NOT NULL,
    "odometerStart" INTEGER,
    "odometerEnd" INTEGER,
    "hoursStart" DECIMAL(10,2),
    "hoursEnd" DECIMAL(10,2),
    "efficiency" DECIMAL(10,2),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contract table
CREATE TABLE IF NOT EXISTS "Contract" (
    "id" SERIAL PRIMARY KEY,
    "contractNumber" VARCHAR(255) UNIQUE NOT NULL,
    "procurementRefNumber" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(255) NOT NULL,
    "dateOfAgreement" TIMESTAMP NOT NULL,
    "contractPrice" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "contractType" VARCHAR(255) NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "completionDate" TIMESTAMP,
    "budgetItemCode" INTEGER,
    "procurementMethod" VARCHAR(255) NOT NULL,
    "dateOfProcurementInitiation" TIMESTAMP NOT NULL,
    "projectId" INTEGER NOT NULL REFERENCES "Project"("id"),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice table
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" SERIAL PRIMARY KEY,
    "invoiceNumber" VARCHAR(255) UNIQUE NOT NULL,
    "serviceProvider" VARCHAR(255) NOT NULL,
    "invoiceDate" TIMESTAMP NOT NULL,
    "dateReceived" TIMESTAMP NOT NULL,
    "procurementDescription" TEXT NOT NULL,
    "providerId" VARCHAR(255) NOT NULL,
    "contractNumber" VARCHAR(255),
    "documentId" INTEGER,
    "goodsReceivedNote" VARCHAR(255),
    "amount" DECIMAL(15,2) NOT NULL,
    "projectId" INTEGER NOT NULL REFERENCES "Project"("id"),
    "status" "InvoiceStatus" DEFAULT 'PENDING',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User"("roleId");
CREATE INDEX IF NOT EXISTS "idx_project_status" ON "Project"("status");
CREATE INDEX IF NOT EXISTS "idx_project_client" ON "Project"("clientId");
CREATE INDEX IF NOT EXISTS "idx_activity_project" ON "Activity"("projectId");
CREATE INDEX IF NOT EXISTS "idx_equipment_status" ON "Equipment"("status");
CREATE INDEX IF NOT EXISTS "idx_fuel_request_status" ON "FuelRequest"("status");
CREATE INDEX IF NOT EXISTS "idx_fuel_request_equipment" ON "FuelRequest"("equipmentId");
CREATE INDEX IF NOT EXISTS "idx_fuel_request_project" ON "FuelRequest"("projectId");

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_role_updated_at BEFORE UPDATE ON "Role" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permission_updated_at BEFORE UPDATE ON "Permission" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_updated_at BEFORE UPDATE ON "Employee" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_updated_at BEFORE UPDATE ON "Client" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON "Project" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activity_updated_at BEFORE UPDATE ON "Activity" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON "Equipment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fuel_request_updated_at BEFORE UPDATE ON "FuelRequest" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
