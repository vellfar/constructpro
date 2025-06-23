import type { Prisma } from "@prisma/client"

// Enhanced type definitions for all database models
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    role: true
    employee: true
    createdProjects: true
    fuelRequestsCreated: true
    fuelRequestsApproved: true
  }
}>

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    client: true
    activities: true
    equipmentAssignments: {
      include: {
        equipment: true
      }
    }
    fuelRequests: true
    invoices: true
    createdBy: {
      select: {
        id: true
        firstName: true
        lastName: true
        email: true
      }
    }
  }
}>

export type EquipmentWithRelations = Prisma.EquipmentGetPayload<{
  include: {
    assignments: {
      include: {
        project: {
          select: {
            id: true
            name: true
            status: true
            projectCode: true
          }
        }
      }
    }
    fuelRequests: {
      include: {
        project: {
          select: {
            name: true
            projectCode: true
          }
        }
        requestedBy: {
          select: {
            firstName: true
            lastName: true
          }
        }
      }
    }
    assessments: true
    locations: true
  }
}>

export type ActivityWithRelations = Prisma.ActivityGetPayload<{
  include: {
    project: {
      select: {
        id: true
        name: true
        status: true
        projectCode: true
        location: true
        startDate: true
        endDate: true
      }
    }
    employee: {
      select: {
        id: true
        firstName: true
        lastName: true
        position: true
      }
    }
  }
}>

export type FuelRequestWithRelations = Prisma.FuelRequestGetPayload<{
  include: {
    equipment: {
      select: {
        id: true
        name: true
        equipmentCode: true
        type: true
      }
    }
    project: {
      select: {
        id: true
        name: true
        projectCode: true
        location: true
      }
    }
    requestedBy: {
      select: {
        id: true
        firstName: true
        lastName: true
        email: true
      }
    }
    approvedBy: {
      select: {
        id: true
        firstName: true
        lastName: true
        email: true
      }
    }
  }
}>

export type ClientWithRelations = Prisma.ClientGetPayload<{
  include: {
    projects: {
      select: {
        id: true
        name: true
        status: true
        budget: true
        startDate: true
        endDate: true
      }
    }
  }
}>

export type EmployeeWithRelations = Prisma.EmployeeGetPayload<{
  include: {
    user: {
      select: {
        id: true
        email: true
        firstName: true
        lastName: true
        role: true
      }
    }
    activities: {
      select: {
        id: true
        name: true
        status: true
        startDate: true
        endDate: true
      }
    }
    equipmentAssignments: {
      include: {
        equipment: {
          select: {
            name: true
            equipmentCode: true
          }
        }
        project: {
          select: {
            name: true
            projectCode: true
          }
        }
      }
    }
  }
}>

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    project: {
      select: {
        id: true
        name: true
        projectCode: true
        client: {
          select: {
            name: true
            email: true
            contactPerson: true
          }
        }
      }
    }
    items: true
  }
}>

// Database operation result types
export interface DatabaseResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  details?: any
}

export interface PaginatedResult<T = any> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Query filter types
export interface BaseFilter {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
}

export interface ProjectFilter extends BaseFilter {
  status?: string[]
  clientId?: number
  startDate?: Date
  endDate?: Date
  budgetMin?: number
  budgetMax?: number
}

export interface EquipmentFilter extends BaseFilter {
  type?: string[]
  status?: string[]
  ownership?: string[]
  make?: string[]
  available?: boolean
}

export interface ActivityFilter extends BaseFilter {
  status?: string[]
  projectId?: number
  employeeId?: number
  startDate?: Date
  endDate?: Date
}

export interface FuelRequestFilter extends BaseFilter {
  status?: string[]
  equipmentId?: number
  projectId?: number
  requestedById?: number
  fuelType?: string[]
  requestDateFrom?: Date
  requestDateTo?: Date
}
