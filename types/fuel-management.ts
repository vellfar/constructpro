import type { FuelRequest, FuelType, FuelUrgency } from "@prisma/client"

export interface FuelRequestWithRelations extends FuelRequest {
  equipment: {
    id: number
    name: string
    equipmentCode: string
    type: string
    status: string
  }
  project: {
    id: number
    name: string
    projectCode?: string | null
    status: string
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

export interface CreateFuelRequestData {
  projectId: number
  equipmentId: number
  fuelType: FuelType
  odometerKm: number
  requestedQuantity: number
  urgency: FuelUrgency
  justification: string
}

export interface ApprovalData {
  approved: boolean
  approvedQuantity?: number
  approvalComments?: string
  rejectionReason?: string
}

export interface IssueData {
  issuedQuantity: number;
  issuedTo: string;
  issuanceComments?: string;
}

export interface AcknowledgeData {
  acknowledgedQuantity: number
  acknowledgmentComments?: string
}

export interface ProjectOption {
  id: number
  name: string
  projectCode?: string | null
  status: string
}

export interface EquipmentOption {
  id: number
  name: string
  equipmentCode: string
  type: string
  status: string
}

export interface FuelRequestFormData {
  projectId: string
  equipmentId: string
  fuelType: string
  requestedQuantity: string
  odometerKm: string
  urgency: string
  justification: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface FuelRequestFilters {
  search: string
  status: string
  projectId: string
  equipmentId: string
  fuelType: string
  urgency: string
  sortBy: string
  sortOrder: "asc" | "desc"
  page: number
  pageSize: number
}
