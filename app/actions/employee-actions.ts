"use server"

import { revalidatePath } from "next/cache"
import { db, safeDbOperation } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// ✅ Only required fields: employeeNumber, firstName, lastName
const employeeSchema = z.object({
  employeeNumber: z.string().min(1, "Employee number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfAppointment: z.string().optional(),
  section: z.string().optional(),
  designation: z.string().optional(),
  wageAmount: z
    .number()
    .positive("Wage amount must be positive")
    .optional(),
  wageFrequency: z.string().optional(),
  gender: z.string().optional(),
  bank: z.string().optional(),
  accountNumber: z.string().optional(),
  bankBranch: z.string().optional(),
  employmentTerms: z.string().optional(),
})

export async function getEmployees() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const employees = await safeDbOperation(
      async () => {
        return await db.employee.findMany({
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            section: true,
            designation: true,
            wageAmount: true,
            wageFrequency: true,
            gender: true,
            employmentTerms: true,
            dateOfAppointment: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      },
      () => [],
      "Get employees"
    )

    return { success: true, data: employees }
  } catch (error) {
    console.error("Failed to fetch employees:", error)
    return { success: false, error: "Failed to fetch employees. Please try again later." }
  }
}

export async function getEmployee(id: number) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const employee = await safeDbOperation(
      async () => {
        return await db.employee.findUnique({
          where: { id },
        })
      },
      () => null,
      "Get employee"
    )

    if (!employee) {
      return { success: false, error: "Employee not found" }
    }

    return { success: true, data: employee }
  } catch (error) {
    console.error("Failed to fetch employee:", error)
    return { success: false, error: "Failed to fetch employee. Please try again later." }
  }
}

export async function createEmployee(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const rawData = {
      employeeNumber: formData.get("employeeNumber") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dateOfAppointment: formData.get("dateOfAppointment") as string,
      section: formData.get("section") as string,
      designation: formData.get("designation") as string,
      wageAmount: formData.get("wageAmount")
        ? Number(formData.get("wageAmount"))
        : undefined,
      wageFrequency: formData.get("wageFrequency") as string,
      gender: formData.get("gender") as string,
      bank: formData.get("bank") as string,
      accountNumber: formData.get("accountNumber") as string,
      bankBranch: formData.get("bankBranch") as string,
      employmentTerms: formData.get("employmentTerms") as string,
    }

    const validatedData = employeeSchema.parse(rawData)

    const employee = await safeDbOperation(
      async () => {
        const existing = await db.employee.findUnique({
          where: { employeeNumber: validatedData.employeeNumber },
        })

        if (existing) {
          throw new Error("Employee number already exists")
        }

        return await db.employee.create({
          data: {
            ...validatedData,
            dateOfAppointment: validatedData.dateOfAppointment
              ? new Date(validatedData.dateOfAppointment)
              : null,
            bank: validatedData.bank || null,
            accountNumber: validatedData.accountNumber || null,
            bankBranch: validatedData.bankBranch || null,
          },
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        })
      },
      () => {
        throw new Error("Database operation failed")
      },
      "Create employee"
    )

    revalidatePath("/employees")
    return { success: true, data: employee }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      if (error.message === "Employee number already exists") {
        return { success: false, error: error.message }
      }
    }

    console.error("Failed to create employee:", error)
    return { success: false, error: "Failed to create employee. Please try again later." }
  }
}

export async function updateEmployee(id: number, formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const rawData = {
      employeeNumber: formData.get("employeeNumber") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dateOfAppointment: formData.get("dateOfAppointment") as string,
      section: formData.get("section") as string,
      designation: formData.get("designation") as string,
      wageAmount: formData.get("wageAmount")
        ? Number(formData.get("wageAmount"))
        : undefined,
      wageFrequency: formData.get("wageFrequency") as string,
      gender: formData.get("gender") as string,
      bank: formData.get("bank") as string,
      accountNumber: formData.get("accountNumber") as string,
      bankBranch: formData.get("bankBranch") as string,
      employmentTerms: formData.get("employmentTerms") as string,
    }

    const validatedData = employeeSchema.parse(rawData)

    const employee = await safeDbOperation(
      async () => {
        const existing = await db.employee.findFirst({
          where: {
            employeeNumber: validatedData.employeeNumber,
            NOT: { id },
          },
        })

        if (existing) {
          throw new Error("Employee number already exists")
        }

        return await db.employee.update({
          where: { id },
          data: {
            ...validatedData,
            dateOfAppointment: validatedData.dateOfAppointment
              ? new Date(validatedData.dateOfAppointment)
              : null,
            bank: validatedData.bank || null,
            accountNumber: validatedData.accountNumber || null,
            bankBranch: validatedData.bankBranch || null,
          },
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
          },
        })
      },
      () => {
        throw new Error("Database operation failed")
      },
      "Update employee"
    )

    revalidatePath("/employees")
    revalidatePath(`/employees/${id}`)
    return { success: true, data: employee }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      if (error.message === "Employee number already exists") {
        return { success: false, error: error.message }
      }
    }

    console.error("Failed to update employee:", error)
    return { success: false, error: "Failed to update employee. Please try again later." }
  }
}

export async function deleteEmployee(id: number) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    await safeDbOperation(
      async () => {
        await db.employee.delete({ where: { id } })
      },
      () => {
        throw new Error("Database operation failed")
      },
      "Delete employee"
    )

    revalidatePath("/employees")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete employee:", error)
    return { success: false, error: "Failed to delete employee. Please try again later." }
  }
}

export async function searchEmployees(query: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const employees = await safeDbOperation(
      async () => {
        return await db.employee.findMany({
          where: {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { employeeNumber: { contains: query, mode: "insensitive" } },
              { designation: { contains: query, mode: "insensitive" } },
              { section: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            section: true,
            designation: true,
            wageAmount: true,
            wageFrequency: true,
            gender: true,
            employmentTerms: true,
            dateOfAppointment: true,
          },
          orderBy: {
            firstName: "asc",
          },
          take: 50,
        })
      },
      () => [],
      "Search employees"
    )

    return { success: true, data: employees }
  } catch (error) {
    console.error("Failed to search employees:", error)
    return { success: false, error: "Failed to search employees. Please try again later." }
  }
}
