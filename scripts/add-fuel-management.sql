-- Add fuel management tables and enums

-- Create fuel type enum
CREATE TYPE fuel_type AS ENUM ('DIESEL', 'PETROL', 'KEROSENE');

-- Create fuel request status enum
CREATE TYPE fuel_request_status AS ENUM (
  'PENDING',
  'APPROVED', 
  'REJECTED',
  'ISSUED',
  'ACKNOWLEDGED',
  'COMPLETED',
  'CANCELLED'
);

-- Create fuel urgency enum
CREATE TYPE fuel_urgency AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Create fuel_requests table
CREATE TABLE IF NOT EXISTS fuel_requests (
  id SERIAL PRIMARY KEY,
  request_number VARCHAR(255) UNIQUE NOT NULL,
  equipment_id INTEGER NOT NULL REFERENCES equipment(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  fuel_type fuel_type NOT NULL,
  requested_quantity DECIMAL(10,2) NOT NULL,
  requested_by_id INTEGER NOT NULL REFERENCES users(id),
  justification TEXT,
  urgency fuel_urgency DEFAULT 'MEDIUM',
  status fuel_request_status DEFAULT 'PENDING',
  
  -- Approval fields
  approved_by_id INTEGER REFERENCES users(id),
  approval_date TIMESTAMP,
  approved_quantity DECIMAL(10,2),
  approval_comments TEXT,
  rejection_reason TEXT,
  
  -- Issuance fields
  issued_by_id INTEGER REFERENCES users(id),
  issuance_date TIMESTAMP,
  issued_quantity DECIMAL(10,2),
  issuance_comments TEXT,
  
  -- Acknowledgment fields
  acknowledged_by_id INTEGER REFERENCES users(id),
  acknowledgment_date TIMESTAMP,
  acknowledged_quantity DECIMAL(10,2),
  acknowledgment_comments TEXT,
  
  -- Completion fields
  completed_by_id INTEGER REFERENCES users(id),
  completion_date TIMESTAMP,
  completion_comments TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id INTEGER REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add Store Manager role if it doesn't exist
INSERT INTO roles (name, description, created_at, updated_at)
SELECT 'Store Manager', 'Manages fuel and equipment inventory', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Store Manager');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fuel_requests_status ON fuel_requests(status);
CREATE INDEX IF NOT EXISTS idx_fuel_requests_equipment_id ON fuel_requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_fuel_requests_project_id ON fuel_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_fuel_requests_requested_by_id ON fuel_requests(requested_by_id);
CREATE INDEX IF NOT EXISTS idx_fuel_requests_created_at ON fuel_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Add quantity validation constraints
ALTER TABLE fuel_requests 
ADD CONSTRAINT chk_requested_quantity_positive 
CHECK (requested_quantity > 0);

ALTER TABLE fuel_requests 
ADD CONSTRAINT chk_approved_quantity_positive 
CHECK (approved_quantity IS NULL OR approved_quantity > 0);

ALTER TABLE fuel_requests 
ADD CONSTRAINT chk_issued_quantity_positive 
CHECK (issued_quantity IS NULL OR issued_quantity > 0);

ALTER TABLE fuel_requests 
ADD CONSTRAINT chk_acknowledged_quantity_positive 
CHECK (acknowledged_quantity IS NULL OR acknowledged_quantity > 0);

COMMIT;
