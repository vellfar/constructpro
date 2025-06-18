"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Validation schema
const employeeSchema = z.object({
  employeeNumber: z.string().min(1, "Employee number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfAppointment: z.string().min(1, "Date of appointment is required"),
  section: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  wageAmount: z.number().positive("Wage amount must be positive"),
  wageFrequency: z.string().min(1, "Wage frequency is required"),
  gender: z.string().min(1, "Gender is required"),
  bank: z.string().optional(),
  accountNumber: z.string().optional(),
  bankBranch: z.string().optional(),
  employmentTerms: z.string().min(1, "Employment terms is required"),
})

export async function getEmployees() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const employees = await prisma.employee.findMany({
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

    return { success: true, data: employees }
  } catch (error) {
    console.error("Failed to fetch employees:", error)
    return { success: false, error: "Failed to fetch employees" }
  }
}

export async function getEmployee(id: number) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
    })

    if (!employee) {
      return { success: false, error: "Employee not found" }
    }

    return { success: true, data: employee }
  } catch (error) {
    console.error("Failed to fetch employee:", error)
    return { success: false, error: "Failed to fetch employee" }
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
      wageAmount: Number.parseFloat(formData.get("wageAmount") as string),
      wageFrequency: formData.get("wageFrequency") as string,
      gender: formData.get("gender") as string,
      bank: formData.get("bank") as string,
      accountNumber: formData.get("accountNumber") as string,
      bankBranch: formData.get("bankBranch") as string,
      employmentTerms: formData.get("employmentTerms") as string,
    }

    // Validate data
    const validatedData = employeeSchema.parse(rawData)

    // Check if employee number already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeNumber: validatedData.employeeNumber },
      select: { id: true },
    })

    if (existingEmployee) {
      return { success: false, error: "Employee number already exists" }
    }

    const employee = await prisma.employee.create({
      data: {
        ...validatedData,
        dateOfAppointment: new Date(validatedData.dateOfAppointment),
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

    revalidatePath("/employees")
    return { success: true, data: employee }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error("Failed to create employee:", error)
    return { success: false, error: "Failed to create employee" }
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
      wageAmount: Number.parseFloat(formData.get("wageAmount") as string),
      wageFrequency: formData.get("wageFrequency") as string,
      gender: formData.get("gender") as string,
      bank: formData.get("bank") as string,
      accountNumber: formData.get("accountNumber") as string,
      bankBranch: formData.get("bankBranch") as string,
      employmentTerms: formData.get("employmentTerms") as string,
    }

    // Validate data
    const validatedData = employeeSchema.parse(rawData)

    // Check if employee number exists for another employee
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        employeeNumber: validatedData.employeeNumber,
        NOT: { id },
      },
      select: { id: true },
    })

    if (existingEmployee) {
      return { success: false, error: "Employee number already exists" }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...validatedData,
        dateOfAppointment: new Date(validatedData.dateOfAppointment),
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

    revalidatePath("/employees")
    revalidatePath(`/employees/${id}`)
    return { success: true, data: employee }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error("Failed to update employee:", error)
    return { success: false, error: "Failed to update employee" }
  }
}

export async function deleteEmployee(id: number) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.employee.delete({
      where: { id },
    })

    revalidatePath("/employees")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete employee:", error)
    return { success: false, error: "Failed to delete employee" }
  }
}

export async function searchEmployees(query: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const employees = await prisma.employee.findMany({
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
      take: 50, // Limit results for performance
    })

    return { success: true, data: employees }
  } catch (error) {
    console.error("Failed to search employees:", error)
    return { success: false, error: "Failed to search employees" }
  }
}
