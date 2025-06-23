export const APP_CONFIG = {
  name: "ConstructPro",
  version: "1.0.0",
  description: "Construction Management System",
  author: "ConstructPro Team",
} as const

export const DATABASE_CONFIG = {
  maxConnections: 10,
  connectionTimeout: 30000,
  queryTimeout: 15000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const

export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  maxPageSize: 100,
  minPageSize: 5,
} as const

export const VALIDATION_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"],
  maxStringLength: 1000,
  minPasswordLength: 8,
} as const

export const CACHE_CONFIG = {
  defaultTTL: 300, // 5 minutes
  maxTTL: 3600, // 1 hour
  minTTL: 60, // 1 minute
} as const

export const STATUS_OPTIONS = {
  PROJECT: ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const,
  EQUIPMENT: ["OPERATIONAL", "MAINTENANCE", "REPAIR", "OUT_OF_SERVICE"] as const,
  ACTIVITY: ["PLANNED", "IN_PROGRESS", "COMPLETED", "DELAYED", "CANCELLED"] as const,
  FUEL_REQUEST: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"] as const,
  INVOICE: ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] as const,
} as const

export const ROLES = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  EMPLOYEE: "Employee",
  STORE_MANAGER: "Store Manager",
} as const

export const PERMISSIONS = {
  CREATE_PROJECT: "create:project",
  READ_PROJECT: "read:project",
  UPDATE_PROJECT: "update:project",
  DELETE_PROJECT: "delete:project",
  MANAGE_USERS: "manage:users",
  APPROVE_FUEL: "approve:fuel",
  VIEW_REPORTS: "view:reports",
  MANAGE_EQUIPMENT: "manage:equipment",
} as const
