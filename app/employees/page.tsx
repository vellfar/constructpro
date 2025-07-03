"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, HardHat, Loader2, Download } from "lucide-react"
import Link from "next/link"
import { getEmployees } from "@/app/actions/employee-actions"
import { EmployeeActions } from "@/components/employee-actions"
import { EmployeeSearch } from "@/components/employee-search"
import { exportToCSV, exportToExcel, formatDataForExport } from "@/lib/export-utils"
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
interface Employee {
  id: number
  employeeNumber: string
  firstName: string
  lastName: string
  section: string
  designation: string
  wageAmount: number
  wageFrequency: string
  gender: string
  employmentTerms: string
  dateOfAppointment: Date
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const result = await getEmployees()
        if (result.success && result.data) {
          setEmployees(result.data)
          setFilteredEmployees(result.data)
        } else {
          setError(result.error || "Failed to load employees")
        }
      } catch (err) {
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const handleExportCSV = () => {
    const exportData = formatDataForExport(employees, "employees")
    exportToCSV(exportData, `employees-${new Date().toISOString().split("T")[0]}`)
  }

  const handleExportExcel = () => {
    const exportData = formatDataForExport(employees, "employees")
    exportToExcel(exportData, `employees-${new Date().toISOString().split("T")[0]}`, "Employees")
  }

  const getEmploymentBadgeVariant = (terms: string) => {
    switch (terms?.toLowerCase()) {
      case "permanent":
        return "default"
      case "contract":
        return "secondary"
      case "temporary":
        return "outline"
      case "probation":
        return "destructive"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="dashboard-header">
          <div className="flex items-center gap-2 font-semibold">
            <HardHat className="h-5 w-5" />
            Employees
          </div>
        </header>
        <div className="p-6 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading employees...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <header className="dashboard-header">
          <div className="flex items-center gap-2 font-semibold">
            <HardHat className="h-5 w-5" />
            Employees
          </div>
        </header>
        <div className="p-6">
          <div className="rounded-md bg-destructive/10 p-4">
            <p className="text-destructive">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="dashboard-header">
        <div className="flex items-center gap-2 font-semibold">
          <HardHat className="h-5 w-5" />
          Employees
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Button size="sm" asChild>
            <Link href="/employees/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="flex flex-col gap-6">
          <EmployeeSearch employees={employees} onFilter={setFilteredEmployees} />

          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>
                Manage your workforce and employee information ({filteredEmployees.length} employees)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Employment Terms</TableHead>
                      <TableHead>Wage</TableHead>
                      <TableHead>Date Appointed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.employeeNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {employee.firstName} {employee.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{employee.gender}</p>
                            </div>
                          </TableCell>
                          <TableCell>{employee.section}</TableCell>
                          <TableCell>{employee.designation}</TableCell>
                          <TableCell>
                            <Badge variant={getEmploymentBadgeVariant(employee.employmentTerms)}>
                              {employee.employmentTerms}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            UGX{employee.wageAmount.toLocaleString()}/{employee.wageFrequency}
                          </TableCell>
                          <TableCell>{new Date(employee.dateOfAppointment).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <EmployeeActions employee={employee} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <HardHat className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {employees.length === 0 ? "No employees found" : "No employees match your search"}
                            </p>
                            {employees.length === 0 && (
                              <Button asChild>
                                <Link href="/employees/new">Add First Employee</Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
