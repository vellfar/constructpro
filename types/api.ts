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
  FuelRequest,
  FuelType,
  FuelUrgency,
} from "@prisma/client"

// Enhanced API Response Types with better error handling
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
    timestamp?: string
  }
}

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
}

// Enhanced validation schemas
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// User Types with enhanced relations
export interface UserWithRelations extends User {
  role: Role & {
    permissions?: Permission[]
  }
  employee?: Employee | null
  _count?: {
    fuelRequests: number
    projectAssignments: number
  }
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

// Employee Types with enhanced validation
export interface EmployeeWithRelations extends Employee {
  user?: User | null
  _count?: {
    fuelRequests: number
  }
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

// Project Types with enhanced relations
export interface ProjectWithRelations extends Project {
  client?: Client | null
  activities?: ActivityWithRelations[]
  equipmentAssignments?: Array<{
    id: number
    equipment: {
      id: number
      name: string
      equipmentCode: string
      type: string
      status: EquipmentStatus
    }
    startDate: Date
    endDate?: Date | null
  }>
  projectAssignments?: Array<{
    id: number
    user: {
      id: number
      firstName: string
      lastName: string
    }
    role: string
    startDate: Date
  }>
  fuelRequests?: FuelRequestWithRelations[]
  _count?: {
    activities: number
    equipmentAssignments: number
    fuelRequests: number
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

// Equipment Types with enhanced tracking
export interface EquipmentWithRelations extends Equipment {
  assignments?: Array<{
    id: number
    project: {
      id: number
      name: string
      projectCode?: string | null
      status: ProjectStatus
    }
    startDate: Date
    endDate?: Date | null
  }>
  fuelRequests?: FuelRequestWithRelations[]
  _count?: {
    assignments: number
    fuelRequests: number
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

// Activity Types with enhanced project relations
export interface ActivityWithRelations extends Activity {
  project: {
    id: number
    name: string
    projectCode?: string | null
    location?: string | null
    status: ProjectStatus
    client?: {
      id: number
      name: string
    } | null
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

// Client Types with enhanced project tracking
export interface ClientWithRelations extends Client {
  projects?: Array<{
    id: number
    name: string
    status: ProjectStatus
    budget?: number | null
    startDate?: Date | null
    endDate?: Date | null
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

// Enhanced Fuel Management Types
export interface FuelRequestWithRelations extends FuelRequest {
  equipment: {
    id: number
    name: string
    equipmentCode: string
    type: string
    status: EquipmentStatus
  }
  project: {
    id: number
    name: string
    projectCode?: string | null
    status: ProjectStatus
  }
  requestedBy: {
    id: number
    firstName: string
    lastName: string
    employee?: {
      employeeNumber: string
      designation: string
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
  odometerKm: number
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

// Enhanced Dashboard Types with performance metrics
export interface DashboardStats {
  projects: {
    total: number
    active: number
    completed: number
    onHold: number
    planning: number
  }
  equipment: {
    total: number
    operational: number
    maintenance: number
    outOfService: number
    utilizationRate: number
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
    issued: number
    acknowledged: number
    completed: number
    rejected: number
    cancelled: number
  }
  recentActivities: Array<{
    id: number
    type: string
    description: string
    timestamp: Date
    user?: string
    entityId?: number
    entityType?: string
  }>
  performance: {
    projectCompletionRate: number
    equipmentUtilizationRate: number
    fuelRequestProcessingTime: number
    averageProjectDuration: number
  }
}

// Search and Filter Types with enhanced capabilities
export interface SearchFilters {
  query?: string
  status?: string | string[]
  dateFrom?: string
  dateTo?: string
  category?: string
  assignedTo?: string
  priority?: string
  projectId?: number
  equipmentId?: number
  clientId?: number
}

export interface SortOptions {
  field: string
  direction: "asc" | "desc"
}

// Audit Log Types with enhanced tracking
export interface AuditLog {
  id: number
  action: string
  entityType: string
  entityId: number
  oldValues?: any
  newValues?: any
  userId: number
  user?: {
    firstName: string
    lastName: string
    email: string
  }
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

// Form State Management
export interface FormState<T = any> {
  data: T
  errors: ValidationError[]
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean
  touchedFields: Set<string>
}

// Cache Types for performance optimization
export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export interface CacheManager {
  get<T>(key: string): CacheEntry<T> | null
  set<T>(key: string, data: T, ttl?: number): void
  delete(key: string): void
  clear(): void
}

// WebSocket Types for real-time updates
export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
  userId?: number
}

// Export utility types
export type EntityType = "user" | "employee" | "project" | "equipment" | "activity" | "client" | "fuelRequest"
export type ActionType = "create" | "update" | "delete" | "view" | "approve" | "reject"
export type NotificationType = "info" | "success" | "warning" | "error"
