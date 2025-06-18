-- Create database tables for Construction Project Management System

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone_number VARCHAR(20),
  role_id INTEGER REFERENCES roles(id),
  employee_id INTEGER UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  contact_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  location VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  budget DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  project_code VARCHAR(20) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_assignments table
CREATE TABLE IF NOT EXISTS project_assignments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  employee_number VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  date_of_appointment DATE NOT NULL,
  section VARCHAR(50) NOT NULL,
  designation VARCHAR(50) NOT NULL,
  wage_amount DECIMAL(15,2) NOT NULL,
  wage_frequency VARCHAR(20) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  bank VARCHAR(50),
  account_number VARCHAR(50),
  bank_branch VARCHAR(50),
  employment_terms VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  equipment_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year_of_manufacture INTEGER,
  ownership VARCHAR(20) NOT NULL,
  measurement_type VARCHAR(20) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  size DECIMAL(10,2),
  work_measure VARCHAR(20) NOT NULL,
  acquisition_cost DECIMAL(15,2),
  supplier VARCHAR(100),
  date_received DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'OPERATIONAL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create equipment_assessments table
CREATE TABLE IF NOT EXISTS equipment_assessments (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  functionality VARCHAR(30) NOT NULL,
  condition VARCHAR(20) NOT NULL,
  insurance BOOLEAN NOT NULL,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessed_by VARCHAR(100) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create equipment_locations table
CREATE TABLE IF NOT EXISTS equipment_locations (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  current_location VARCHAR(100) NOT NULL,
  date_moved DATE NOT NULL DEFAULT CURRENT_DATE,
  officer VARCHAR(100) NOT NULL,
  authorizing_officer VARCHAR(100) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create equipment_assignments table
CREATE TABLE IF NOT EXISTS equipment_assignments (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  assigned_by VARCHAR(100) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activity_measurements table
CREATE TABLE IF NOT EXISTS activity_measurements (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  bill_item INTEGER NOT NULL,
  item_description TEXT NOT NULL,
  unit VARCHAR(20) NOT NULL,
  section VARCHAR(50) NOT NULL,
  measured_date DATE NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activity_estimates table
CREATE TABLE IF NOT EXISTS activity_estimates (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  item_no INTEGER NOT NULL,
  item_description TEXT NOT NULL,
  major_activity VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create fuel_requests table
CREATE TABLE IF NOT EXISTS fuel_requests (
  id SERIAL PRIMARY KEY,
  request_number VARCHAR(20) UNIQUE NOT NULL,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  fuel_type VARCHAR(20) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  requested_by_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  justification TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  approved_by_id INTEGER REFERENCES users(id),
  approval_date TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create fuel_issuances table
CREATE TABLE IF NOT EXISTS fuel_issuances (
  id SERIAL PRIMARY KEY,
  issue_number VARCHAR(20) UNIQUE NOT NULL,
  request_id INTEGER REFERENCES fuel_requests(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  issued_by_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fuel_station VARCHAR(100),
  odometer_reading INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create fuel_consumptions table
CREATE TABLE IF NOT EXISTS fuel_consumptions (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  issuance_id INTEGER REFERENCES fuel_issuances(id) ON DELETE CASCADE,
  activity_description TEXT,
  consumption_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  quantity_used DECIMAL(10,2) NOT NULL,
  odometer_start INTEGER,
  odometer_end INTEGER,
  hours_start DECIMAL(10,2),
  hours_end DECIMAL(10,2),
  efficiency DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  contract_number VARCHAR(20) UNIQUE NOT NULL,
  procurement_ref_number VARCHAR(50) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  date_of_agreement DATE NOT NULL,
  contract_price DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  contract_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  completion_date DATE,
  budget_item_code INTEGER,
  procurement_method VARCHAR(50) NOT NULL,
  date_of_procurement_initiation DATE NOT NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  service_provider VARCHAR(100) NOT NULL,
  invoice_date DATE NOT NULL,
  date_received DATE NOT NULL,
  procurement_description TEXT NOT NULL,
  provider_id VARCHAR(50) NOT NULL,
  contract_number VARCHAR(50),
  document_id INTEGER,
  goods_received_note VARCHAR(50),
  amount DECIMAL(15,2) NOT NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create fuel approval workflow tables
CREATE TABLE IF NOT EXISTS fuel_approval_workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_approval_steps (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES fuel_approval_workflows(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workflow_id, step_number)
);

-- Create fuel request approval history table
CREATE TABLE IF NOT EXISTS fuel_request_approvals (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES fuel_requests(id) ON DELETE CASCADE,
  step_id INTEGER REFERENCES fuel_approval_steps(id) ON DELETE CASCADE,
  approved_by_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  comments TEXT,
  approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
