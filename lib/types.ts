// Re-export commonly used types from other type files
export type {
  UserWithRelations,
  ProjectWithRelations,
  EquipmentWithRelations,
  ActivityWithRelations,
  FuelRequestWithRelations,
  ClientWithRelations,
  EmployeeWithRelations,
  InvoiceWithRelations,
} from "@/types/database"

export type {
  ApiResponse,
  CreateUserRequest,
  UpdateUserRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  CreateActivityRequest,
  UpdateActivityRequest,
  CreateClientRequest,
  UpdateClientRequest,
  CreateFuelRequestRequest,
  ApproveFuelRequestRequest,
  IssueFuelRequestRequest,
  DashboardStats,
  SearchFilters,
  FormState,
  ValidationError,
} from "@/types/api"

// Basic types for backward compatibility
export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: number
  name: string
  description?: string
  projectCode?: string
  status: string
  budget?: number
  startDate?: string
  endDate?: string
  location?: string
  clientId?: number
  createdAt: string
  updatedAt: string
}

export interface Equipment {
  id: number
  name: string
  equipmentCode: string
  type: string
  make: string
  model: string
  status: string
  ownership: string
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: number
  name: string
  description?: string
  status: string
  projectId: number
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: number
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
}

export interface Employee {
  id: number
  employeeNumber: string
  firstName: string
  lastName: string
  designation: string
  section: string
  dateOfAppointment: string
  wageAmount: number
  wageFrequency: string
  gender: string
  employmentTerms: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface FuelRequest {
  id: string
  requestNumber: string
  projectId: string
  equipmentId?: string
  fuelType: string
  quantity: number
  status: string
  urgency: string
  justification: string
  requestedById: string
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: number
  invoiceNumber: string
  projectId: number
  amount: number
  status: string
  dueDate?: string
  issuedDate: string
  createdAt: string
  updatedAt: string
}
