import { z } from "zod"
import { VALIDATION_CONFIG, STATUS_OPTIONS } from "./constants"

// Base validation schemas
export const idSchema = z.number().int().positive()
export const emailSchema = z.string().email().max(255)
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-$$$$]+$/)
  .max(20)
  .optional()
export const urlSchema = z.string().url().max(500).optional()
export const dateSchema = z.coerce.date()
export const optionalDateSchema = z.coerce.date().optional()
export const currencySchema = z.number().min(0).max(999999999.99)
export const percentageSchema = z.number().min(0).max(100)

// User validation schemas
export const userCreateSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: emailSchema,
  username: z.string().min(3).max(50),
  password: z.string().min(VALIDATION_CONFIG.minPasswordLength).max(128),
  roleId: idSchema,
  employeeId: idSchema.optional(),
})

export const userUpdateSchema = userCreateSchema.partial().extend({
  id: idSchema,
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(VALIDATION_CONFIG.minPasswordLength).max(128),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

// Project validation schemas
export const projectCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(VALIDATION_CONFIG.maxStringLength).optional(),
  location: z.string().max(200).optional(),
  budget: currencySchema,
  startDate: dateSchema,
  endDate: optionalDateSchema,
  clientId: idSchema.optional(),
  status: z.enum(STATUS_OPTIONS.PROJECT).default("PLANNING"),
})

export const projectUpdateSchema = projectCreateSchema.partial().extend({
  id: idSchema,
})

// Equipment validation schemas
export const equipmentCreateSchema = z.object({
  equipmentCode: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  yearOfManufacture: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  ownership: z.enum(["OWNED", "RENTED", "LEASED"]),
  measurementType: z.string().min(1).max(50),
  unit: z.string().min(1).max(20),
  size: z.number().positive().optional(),
  workMeasure: z.string().min(1).max(100),
  acquisitionCost: currencySchema.optional(),
  supplier: z.string().max(200).optional(),
  dateReceived: optionalDateSchema,
  status: z.enum(STATUS_OPTIONS.EQUIPMENT).default("OPERATIONAL"),
})

export const equipmentUpdateSchema = equipmentCreateSchema.partial().extend({
  id: idSchema,
})

// Activity validation schemas
export const activityCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(VALIDATION_CONFIG.maxStringLength).optional(),
  projectId: idSchema,
  employeeId: idSchema.optional(),
  status: z.enum(STATUS_OPTIONS.ACTIVITY).default("PLANNED"),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
})

export const activityUpdateSchema = activityCreateSchema.partial().extend({
  id: idSchema,
})

// Fuel request validation schemas
export const fuelRequestCreateSchema = z.object({
  equipmentId: idSchema,
  projectId: idSchema,
  fuelType: z.string().min(1).max(50),
  quantity: z.number().positive().max(10000),
  unit: z.string().min(1).max(20),
  requestDate: dateSchema,
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  notes: z.string().max(VALIDATION_CONFIG.maxStringLength).optional(),
})

export const fuelRequestUpdateSchema = fuelRequestCreateSchema.partial().extend({
  id: idSchema,
  status: z.enum(STATUS_OPTIONS.FUEL_REQUEST),
  approvedById: idSchema.optional(),
  approvedAt: optionalDateSchema,
  rejectionReason: z.string().max(500).optional(),
})

// Client validation schemas
export const clientCreateSchema = z.object({
  name: z.string().min(1).max(200),
  contactPerson: z.string().min(1).max(100),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  website: urlSchema,
  taxId: z.string().max(50).optional(),
})

export const clientUpdateSchema = clientCreateSchema.partial().extend({
  id: idSchema,
})

// Employee validation schemas
export const employeeCreateSchema = z.object({
  employeeCode: z.string().min(1).max(50),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: emailSchema,
  phone: phoneSchema,
  position: z.string().min(1).max(100),
  department: z.string().max(100).optional(),
  hireDate: dateSchema,
  salary: currencySchema.optional(),
  address: z.string().max(500).optional(),
  emergencyContact: z.string().max(200).optional(),
  emergencyPhone: phoneSchema,
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
})

export const employeeUpdateSchema = employeeCreateSchema.partial().extend({
  id: idSchema,
})

// Invoice validation schemas
export const invoiceItemSchema = z.object({
  description: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unitPrice: currencySchema,
  amount: currencySchema,
})

export const invoiceCreateSchema = z.object({
  invoiceNumber: z.string().min(1).max(50),
  projectId: idSchema,
  issueDate: dateSchema,
  dueDate: dateSchema,
  subtotal: currencySchema,
  taxRate: percentageSchema.default(0),
  taxAmount: currencySchema.default(0),
  total: currencySchema,
  status: z.enum(STATUS_OPTIONS.INVOICE).default("DRAFT"),
  notes: z.string().max(VALIDATION_CONFIG.maxStringLength).optional(),
  items: z.array(invoiceItemSchema).min(1),
})

export const invoiceUpdateSchema = invoiceCreateSchema.partial().extend({
  id: idSchema,
})

// Filter validation schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(5).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().max(200).optional(),
})

export const projectFilterSchema = paginationSchema.extend({
  status: z.array(z.enum(STATUS_OPTIONS.PROJECT)).optional(),
  clientId: idSchema.optional(),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  budgetMin: currencySchema.optional(),
  budgetMax: currencySchema.optional(),
})

export const equipmentFilterSchema = paginationSchema.extend({
  type: z.array(z.string()).optional(),
  status: z.array(z.enum(STATUS_OPTIONS.EQUIPMENT)).optional(),
  ownership: z.array(z.enum(["OWNED", "RENTED", "LEASED"])).optional(),
  make: z.array(z.string()).optional(),
  available: z.boolean().optional(),
})

export const fuelRequestFilterSchema = paginationSchema.extend({
  status: z.array(z.enum(STATUS_OPTIONS.FUEL_REQUEST)).optional(),
  equipmentId: idSchema.optional(),
  projectId: idSchema.optional(),
  requestedById: idSchema.optional(),
  fuelType: z.array(z.string()).optional(),
  requestDateFrom: optionalDateSchema,
  requestDateTo: optionalDateSchema,
})

// Validation helper functions
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {}
  errors.errors.forEach((error) => {
    const path = error.path.join(".")
    formatted[path] = error.message
  })
  return formatted
}

// Fuel request validation schema
export const fuelRequestSchema = z.object({
  equipmentId: idSchema,
  projectId: idSchema,
  fuelType: z.enum(["DIESEL", "PETROL", "KEROSENE"]),
  requestedQuantity: z.number().positive().max(10000),
  justification: z.string().min(1).max(VALIDATION_CONFIG.maxStringLength),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  odometerKm: z.number().min(0),
})

// Generic validation function
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
):
  | { isValid: true; data: T; errors: [] }
  | { isValid: false; data: null; errors: Array<{ message: string; path: string[] }> } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { isValid: true, data: result.data, errors: [] }
  }
  return {
    isValid: false,
    data: null,
    errors: result.error.errors.map((err) => ({
      message: err.message,
      path: err.path.map((p) => String(p)),
    })),
  }
}

// Additional validation helpers
export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === "") {
    return `${fieldName} is required`
  }
  return null
}

export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return "Invalid email format"
  }
  return null
}

export function validatePhone(phone: string): string | null {
  const phoneRegex = /^\+?[\d\s\-()]+$/
  if (!phoneRegex.test(phone)) {
    return "Invalid phone number format"
  }
  return null
}

export function validatePositiveNumber(value: number, fieldName: string): string | null {
  if (isNaN(value) || value <= 0) {
    return `${fieldName} must be a positive number`
  }
  return null
}

export function validateDateRange(startDate: Date, endDate: Date): string | null {
  if (startDate >= endDate) {
    return "End date must be after start date"
  }
  return null
}
