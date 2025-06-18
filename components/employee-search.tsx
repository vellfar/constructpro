"use client"

import React from "react"

import { useState, useTransition, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

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

interface EmployeeSearchProps {
  employees: Employee[]
  onFilter: (filteredEmployees: Employee[]) => void
}

export function EmployeeSearch({ employees, onFilter }: EmployeeSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [termsFilter, setTermsFilter] = useState("all")
  const [isPending, startTransition] = useTransition()

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Get unique departments and terms for filters
  const { departments, employmentTerms } = useMemo(() => {
    const depts = [...new Set(employees.map((emp) => emp.section))].sort()
    const terms = [...new Set(employees.map((emp) => emp.employmentTerms))].sort()
    return { departments: depts, employmentTerms: terms }
  }, [employees])

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    let filtered = employees

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (emp) =>
          emp.firstName.toLowerCase().includes(query) ||
          emp.lastName.toLowerCase().includes(query) ||
          emp.employeeNumber.toLowerCase().includes(query) ||
          emp.designation.toLowerCase().includes(query) ||
          emp.section.toLowerCase().includes(query),
      )
    }

    // Apply department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((emp) => emp.section === departmentFilter)
    }

    // Apply employment terms filter
    if (termsFilter !== "all") {
      filtered = filtered.filter((emp) => emp.employmentTerms === termsFilter)
    }

    return filtered
  }, [employees, debouncedSearchQuery, departmentFilter, termsFilter])

  // Update parent component when filters change
  React.useEffect(() => {
    onFilter(filteredEmployees)
  }, [filteredEmployees, onFilter])

  const clearFilters = () => {
    setSearchQuery("")
    setDepartmentFilter("all")
    setTermsFilter("all")
  }

  const hasActiveFilters = searchQuery || departmentFilter !== "all" || termsFilter !== "all"

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search employees by name, number, designation..."
          className="w-full bg-background pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={termsFilter} onValueChange={setTermsFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Employment Terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            {employmentTerms.map((term) => (
              <SelectItem key={term} value={term}>
                {term}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
