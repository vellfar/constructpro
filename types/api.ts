import type {
  User,
  Employee,
  Project,
  Equipment,
  Activity,
  Client,
  Role,
  Permission,
  ProjectStatus,
  EquipmentStatus,
  ActivityStatus,
  EquipmentOwnership,
} from "@prisma/client"

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
}

// User Types
export interface UserWithRelations extends User {
  role: Role
  employee?: Employee | null
  permissions?: Permission[]
}

export interface CreateUserRequest {
  email: string
  username?: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  roleId: number
  employeeId?: number
}

export interface UpdateUserRequest {
  email?: string
  username?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  roleId?: number
  isActive?: boolean
}

// Employee Types
export interface EmployeeWithRelations extends Employee {
  user?: User | null
}

export interface CreateEmployeeRequest {
  employeeNumber: string
  firstName: string
  lastName: string
  dateOfAppointment: string
  section: string
  designation: string
  wageAmount: number
  wageFrequency: string
  gender: string
  bank?: string
  accountNumber?: string
  bankBranch?: string
  employmentTerms: string
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {}

// Project Types
export interface ProjectWithRelations extends Project {
  client?: Client | null
  activities?: Activity[]
  _count?: {
    activities: number
  }
}

export interface CreateProjectRequest {
  name: string
  description?: string
  location?: string
  budget: number
  clientId?: number
  startDate?: string
  endDate?: string
  projectCode?: string
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus
}

// Equipment Types
export interface EquipmentWithRelations extends Equipment {
  _count?: {
    assignments: number
  }
}

export interface CreateEquipmentRequest {
  equipmentCode: string
  name: string
  type: string
  make: string
  model: string
  yearOfManufacture?: number
  ownership: EquipmentOwnership
  measurementType: string
  unit: string
  size?: number
  workMeasure: string
  acquisitionCost?: number
  supplier?: string
  dateReceived?: string
}

export interface UpdateEquipmentRequest extends Partial<CreateEquipmentRequest> {
  status?: EquipmentStatus
}

// Activity Types
export interface ActivityWithRelations extends Activity {
  project: {
    id: number
    name: string
    projectCode?: string | null
    location?: string | null
    status: ProjectStatus
  }
}

export interface CreateActivityRequest {
  name: string
  description?: string
  projectId: number
  startDate?: string
  endDate?: string
}

export interface UpdateActivityRequest extends Partial<CreateActivityRequest> {
  status?: ActivityStatus
}

// Client Types
export interface ClientWithRelations extends Client {
  projects?: Array<{
    id: number
    name: string
    status: ProjectStatus
    budget?: number | null
  }>
  _count?: {
    projects: number
  }
}

export interface CreateClientRequest {
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}

// Fuel Management Types
export enum FuelType {
  DIESEL = "DIESEL",
  PETROL = "PETROL",
  KEROSENE = "KEROSENE",
}

export enum FuelRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ISSUED = "ISSUED",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum FuelUrgency {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface FuelRequest {
  id: number
  requestNumber: string
  equipmentId: number
  projectId: number
  fuelType: FuelType
  requestedQuantity: number
  requestedById: number
  justification?: string | null
  urgency: FuelUrgency
  status: FuelRequestStatus
  approvedById?: number | null
  approvalDate?: Date | null
  approvedQuantity?: number | null
  approvalComments?: string | null
  rejectionReason?: string | null
  issuedById?: number | null
  issuanceDate?: Date | null
  issuedQuantity?: number | null
  issuanceComments?: string | null
  acknowledgedById?: number | null
  acknowledgmentDate?: Date | null
  acknowledgedQuantity?: number | null
  acknowledgmentComments?: string | null
  completedById?: number | null
  completionDate?: Date | null
  completionComments?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface FuelRequestWithRelations extends FuelRequest {
  equipment: {
    id: number
    name: string
    equipmentCode: string
    type: string
  }
  project: {
    id: number
    name: string
    projectCode?: string | null
  }
  requestedBy: {
    id: number
    firstName: string
    lastName: string
    employee?: {
      employeeNumber: string
    } | null
  }
  approvedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
  issuedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
  acknowledgedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
  completedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
}

export interface CreateFuelRequestRequest {
  equipmentId: number
  projectId: number
  fuelType: FuelType
  requestedQuantity: number
  justification: string
  urgency: FuelUrgency
}

export interface ApproveFuelRequestRequest {
  approved: boolean
  approvedQuantity?: number
  approvalComments?: string
  rejectionReason?: string
}

export interface IssueFuelRequestRequest {
  issuedQuantity: number
  issuanceComments?: string
}

export interface AcknowledgeFuelRequestRequest {
  acknowledgedQuantity: number
  acknowledgmentComments?: string
}

export interface CompleteFuelRequestRequest {
  completionComments?: string
}

// Dashboard Types
export interface DashboardStats {
  projects: {
    total: number
    active: number
    completed: number
    onHold: number
  }
  equipment: {
    total: number
    operational: number
    maintenance: number
    outOfService: number
  }
  employees: {
    total: number
    active: number
    inactive: number
  }
  fuelRequests: {
    total: number
    pending: number
    approved: number
    completed: number
  }
  recentActivities: Array<{
    id: number
    type: string
    description: string
    timestamp: Date
    user?: string
  }>
}

// Form Validation Types
export interface ValidationError {
  field: string
  message: string
}

export interface FormState<T = any> {
  data: T
  errors: ValidationError[]
  isSubmitting: boolean
  isValid: boolean
}

// Search and Filter Types
export interface SearchFilters {
  query?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  category?: string
  assignedTo?: string
  priority?: string
}

// Audit Log Types
export interface AuditLog {
  id: number
  action: string
  entityType: string
  entityId: number
  oldValues?: any
  newValues?: any
  userId: number
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}
