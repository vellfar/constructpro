"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  HardHat,
  Loader2,
  Download,
  Search,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { getEmployees } from "@/app/actions/employee-actions"
import { exportToCSV, exportToExcel, formatDataForExport } from "@/lib/export-utils"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [sectionFilter, setSectionFilter] = useState("all")
  const [termsFilter, setTermsFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")

  useEffect(() => {
    let ignore = false;
    const fetchEmployees = async () => {
      let attempts = 0;
      const maxAttempts = 3;
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
      while (attempts < maxAttempts) {
        try {
          setLoading(true);
          setError(null);
          const result = await getEmployees().catch(() => null);
          if (result === null) {
            throw new Error("Network error. Please check your connection.");
          }
          if (result.success && result.data) {
            if (!ignore) {
              setEmployees(result.data);
              setFilteredEmployees(result.data);
            }
          } else {
            setError(result.error || "Failed to load employees");
            setEmployees([]);
            setFilteredEmployees([]);
          }
          setLoading(false);
          return;
        } catch (err: any) {
          attempts++;
          if (attempts >= maxAttempts) {
            setError(err?.message || "An unexpected error occurred");
            setEmployees([]);
            setFilteredEmployees([]);
            setLoading(false);
            return;
          }
          await delay(1000 * attempts);
        }
      }
    };
    fetchEmployees();
    return () => { ignore = true; };
  }, []);

  // Filter employees based on search and filters
  useEffect(() => {
    let filtered = employees

    if (searchTerm) {
      filtered = filtered.filter(
        (employee) =>
          `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.designation.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (sectionFilter !== "all") {
      filtered = filtered.filter((employee) => employee.section === sectionFilter)
    }

    if (termsFilter !== "all") {
      filtered = filtered.filter((employee) => employee.employmentTerms === termsFilter)
    }

    setFilteredEmployees(filtered)
  }, [employees, searchTerm, sectionFilter, termsFilter])

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
    }).format(amount)
  }

  const getUniqueValues = (key: keyof Employee) => {
    return [...new Set(employees.map((emp) => emp[key] as string))].filter(Boolean)
  }

  const getEmployeeStats = () => {
    const total = employees.length
    const permanent = employees.filter((e) => e.employmentTerms === "permanent").length
    const contract = employees.filter((e) => e.employmentTerms === "contract").length
    const sections = new Set(employees.map((e) => e.section)).size

    return { total, permanent, contract, sections }
  }

  const stats = getEmployeeStats()

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-4 border-b bg-white px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
            <HardHat className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Employee Management</span>
            <span className="sm:hidden">Employees</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
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
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-4 border-b bg-white px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
            <HardHat className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Employee Management</span>
            <span className="sm:hidden">Employees</span>
          </div>
        </header>
        <div className="flex-1 p-3 sm:p-4 lg:p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <div>
                  <h3 className="font-medium">Error loading employees</h3>
                  <p className="text-sm text-red-600">{error}</p>
                  <Button onClick={() => window.location.reload()} className="mt-4" size="sm">
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-4 border-b bg-white px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
          <HardHat className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Employee Management</span>
          <span className="sm:hidden">Employees</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" asChild className="hidden sm:flex">
            <Link href="/employees/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Link>
          </Button>
          <Button size="sm" asChild className="sm:hidden">
            <Link href="/employees/new">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total</p>
                  <p className="text-lg sm:text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <HardHat className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Permanent</p>
                  <p className="text-lg sm:text-xl font-bold">{stats.permanent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Contract</p>
                  <p className="text-lg sm:text-xl font-bold">{stats.contract}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Sections</p>
                  <p className="text-lg sm:text-xl font-bold">{stats.sections}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Select value={sectionFilter} onValueChange={setSectionFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {getUniqueValues("section").map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={termsFilter} onValueChange={setTermsFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      {getUniqueValues("employmentTerms").map((terms) => (
                        <SelectItem key={terms} value={terms}>
                          {terms}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="flex-1 sm:flex-none bg-transparent"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    className="flex-1 sm:flex-none bg-transparent"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export Excel</span>
                    <span className="sm:hidden">Excel</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HardHat className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No employees found</h3>
              <p className="text-gray-600 text-center mb-4">
                {employees.length === 0
                  ? "Get started by adding your first employee."
                  : "No employees match your current filters."}
              </p>
              <Button asChild>
                <Link href="/employees/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Card>
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
                        {filteredEmployees.map((employee) => (
                          <TableRow key={employee.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{employee.employeeNumber}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {employee.firstName} {employee.lastName}
                                </p>
                                <p className="text-sm text-gray-600">{employee.gender}</p>
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
                              {formatCurrency(employee.wageAmount)}/{employee.wageFrequency}
                            </TableCell>
                            <TableCell>{new Date(employee.dateOfAppointment).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/employees/${employee.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/employees/${employee.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden">
              <div className="grid gap-4">
                {filteredEmployees.map((employee) => (
                  <Card key={employee.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {employee.firstName} {employee.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{employee.employeeNumber}</p>
                        </div>
                        <Badge variant={getEmploymentBadgeVariant(employee.employmentTerms)}>
                          {employee.employmentTerms}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{employee.section}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <HardHat className="h-4 w-4 text-gray-400" />
                          <span>{employee.designation}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span>
                            {formatCurrency(employee.wageAmount)}/{employee.wageFrequency}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(employee.dateOfAppointment).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                          <Link href={`/employees/${employee.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                          <Link href={`/employees/${employee.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
