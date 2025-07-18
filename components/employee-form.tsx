"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { createEmployee, updateEmployee } from "@/app/actions/employee-actions"

interface Employee {
  id?: number
  employeeNumber: string
  firstName: string
  lastName: string
  dateOfAppointment: Date
  section: string
  designation: string
  wageAmount: number
  wageFrequency: string
  gender: string
  bank?: string | null
  accountNumber?: string | null
  bankBranch?: string | null
  employmentTerms: string
}

interface EmployeeFormProps {
  employee?: Employee
  mode: "create" | "edit"
}

export function EmployeeForm({ employee, mode }: EmployeeFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      setErrors({})
      try {
        let result
        if (mode === "create") {
          result = await createEmployee(formData)
        } else if (employee?.id) {
          result = await updateEmployee(employee.id, formData)
        }

        if (result?.success) {
          toast.success(mode === "create" ? "Employee created successfully!" : "Employee updated successfully!")
          router.push("/employees")
          router.refresh()
        } else {
          toast.error(result?.error || "Something went wrong")
          if (result?.error) {
            setErrors({ general: result.error })
          }
        }
      } catch (error) {
        toast.error("An unexpected error occurred")
        setErrors({ general: "An unexpected error occurred" })
      }
    })
  }

  return (
    <div className="flex flex-col">
      <header className="dashboard-header">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/employees">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Link>
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          {mode === "create" ? "New Employee" : "Edit Employee"}
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto w-full">
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle>{mode === "create" ? "Add New Employee" : "Edit Employee"}</CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Enter employee information and employment details"
                : "Update employee information and employment details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="rounded-md bg-destructive/10 p-4">
                  <p className="text-destructive text-sm">{errors.general}</p>
                </div>
              )}

              {/* Required Fields Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground border-b pb-2">Required Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeNumber">Employee Number *</Label>
                    <Input
                      id="employeeNumber"
                      name="employeeNumber"
                      defaultValue={employee?.employeeNumber || ""}
                      placeholder="EMP-001"
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select name="gender" defaultValue={employee?.gender || "Male"} required disabled={isPending}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={employee?.firstName || ""}
                      placeholder="John"
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={employee?.lastName || ""}
                      placeholder="Doe"
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Optional Fields Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground border-b pb-2">Employment Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="section">Department</Label>
                    <Input
                      id="section"
                      name="section"
                      defaultValue={employee?.section || ""}
                      placeholder="e.g., Quality Control, Management, Production"
                      disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      Common departments: Quality Control, Management, Production, Administrative Support, Mechanical,
                      Survey
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      name="designation"
                      defaultValue={employee?.designation || ""}
                      placeholder="e.g., Site Engineer, Project Manager"
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfAppointment">Date of Appointment</Label>
                  <Input
                    id="dateOfAppointment"
                    name="dateOfAppointment"
                    type="date"
                    defaultValue={
                      employee?.dateOfAppointment
                        ? new Date(employee.dateOfAppointment).toISOString().split("T")[0]
                        : ""
                    }
                    disabled={isPending}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wageAmount">Wage Amount</Label>
                    <Input
                      id="wageAmount"
                      name="wageAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={employee?.wageAmount || ""}
                      placeholder="5000.00"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wageFrequency">Wage Frequency</Label>
                    <Select
                      name="wageFrequency"
                      defaultValue={employee?.wageFrequency || "Monthly"}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Hourly">Hourly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentTerms">Employment Terms</Label>
                    <Input
                      id="employmentTerms"
                      name="employmentTerms"
                      defaultValue={employee?.employmentTerms || ""}
                      placeholder="e.g., Permanent, Contract, Temporary"
                      disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      Common terms: Permanent, Contract, Temporary, Probation
                    </p>
                  </div>
                </div>
              </div>

              {/* Banking Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground border-b pb-2">Banking Information (Optional)</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank">Bank</Label>
                    <Input
                      id="bank"
                      name="bank"
                      defaultValue={employee?.bank || ""}
                      placeholder="Bank Name"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      defaultValue={employee?.accountNumber || ""}
                      placeholder="Account Number"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankBranch">Bank Branch</Label>
                    <Input
                      id="bankBranch"
                      name="bankBranch"
                      defaultValue={employee?.bankBranch || ""}
                      placeholder="Branch"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <Button type="submit" disabled={isPending} className="min-w-[120px]">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === "create" ? "Creating..." : "Updating..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {mode === "create" ? "Create Employee" : "Update Employee"}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" asChild disabled={isPending}>
                  <Link href="/employees">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
