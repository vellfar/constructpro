"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  Filter,
  Loader2,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  AlertCircle,
  Users,
  Wrench,
  Eye,
  Edit,
  MoreHorizontal,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

interface Project {
  id: number
  name: string
  projectCode: string
  status: string
  budget: number
  location: string | null
  startDate: string
  endDate: string | null
  client: { name: string } | null
  _count: {
    activities: number
    equipmentAssignments: number
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL_STATUS")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Move fetchProjects to be a stable function so it can be used in event handlers
  const fetchProjects = async () => {
    let attempts = 0
    const maxAttempts = 3
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "10",
      search: searchTerm,
      status: statusFilter === "ALL_STATUS" ? "" : statusFilter,
    })

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/projects?${params}`).catch(() => null)

        if (response?.status === 401) {
          setError("Session expired. Please log in again.")
          setProjects([])
          setTotal(0)
          setTotalPages(1)
          setLoading(false)
          return
        }

        if (!response) {
          throw new Error("Network error. Please check your connection.")
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const projectsArray = data.data || data.projects || []
        const totalCount = data.total || data.pagination?.total || 0

        setProjects(projectsArray || [])
        setTotal(totalCount)
        setTotalPages(Math.ceil(totalCount / 10))
        setLoading(false)
        return
      } catch (error: any) {
        attempts++
        if (attempts >= maxAttempts) {
          setError(error instanceof Error ? error.message : "Failed to load projects")
          setProjects([])
          setTotal(0)
          setTotalPages(1)
          setLoading(false)
          return
        }
        await delay(1000 * attempts)
      }
    }
  }

  useEffect(() => {
    let ignore = false

    const fetchAndSet = async () => {
      let attempts = 0
      const maxAttempts = 3
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

      while (attempts < maxAttempts) {
        try {
          setLoading(true)
          setError(null)

          const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: "10",
            search: searchTerm,
            status: statusFilter === "ALL_STATUS" ? "" : statusFilter,
          })

          const response = await fetch(`/api/projects?${params}`).catch(() => null)

          if (response?.status === 401) {
            setError("Session expired. Please log in again.")
            setProjects([])
            setTotal(0)
            setTotalPages(1)
            setLoading(false)
            return
          }

          if (!response) {
            throw new Error("Network error. Please check your connection.")
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()
          const projectsArray = data.data || data.projects || []
          const totalCount = data.total || data.pagination?.total || 0

          if (!ignore) {
            setProjects(projectsArray || [])
            setTotal(totalCount)
            setTotalPages(Math.ceil(totalCount / 10))
          }

          setLoading(false)
          return
        } catch (error) {
          attempts++
          if (attempts >= maxAttempts) {
            setError(error instanceof Error ? error.message : "Failed to load projects")
            setProjects([])
            setTotal(0)
            setTotalPages(1)
            setLoading(false)
            return
          }
          await delay(1000 * attempts)
        }
      }
    }

    fetchAndSet()
    return () => {
      ignore = true
    }
  }, [currentPage, searchTerm, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-50 text-green-700 border-green-200"
      case "PLANNING":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "ON_HOLD":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "COMPLETED":
        return "bg-gray-50 text-gray-700 border-gray-200"
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 truncate">Projects</h1>
              <p className="mt-1 text-sm text-gray-600">
                {total} {total === 1 ? "project" : "projects"} total
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button asChild className="w-full sm:w-auto bg-blue-700 hover:bg-blue-600 text-white" size="sm">
                <Link href="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden xs:inline">New Project</span>
                  <span className="xs:hidden">New</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-4 sm:mb-6 border-gray-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex space-x-2 sm:space-x-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 border-gray-300 focus:border-gray-500 focus:ring-gray-500 text-sm">
                    <Filter className="mr-2 h-4 w-4 flex-shrink-0" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_STATUS">All Status</SelectItem>
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={fetchProjects}
                  disabled={loading}
                  className="border-gray-300 hover:bg-gray-50 bg-transparent px-3"
                  size="sm"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-4 sm:mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-red-900 text-sm">Error loading projects</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <Button
                    variant="outline"
                    onClick={fetchProjects}
                    className="mt-3 border-red-200 text-red-700 hover:bg-red-50 bg-transparent"
                    size="sm"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
              <span className="text-gray-600 text-sm sm:text-base">Loading projects...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && !error && (
          <Card className="border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== "ALL_STATUS" ? "No projects found" : "No projects yet"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md text-sm sm:text-base">
                {searchTerm || statusFilter !== "ALL_STATUS"
                  ? "No projects match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first project to begin managing your construction work."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Link href="/projects/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Link>
                </Button>
                {(searchTerm || statusFilter !== "ALL_STATUS") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("ALL_STATUS")
                    }}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Content */}
        {!loading && projects.length > 0 && (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Card className="border-gray-200 shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="font-semibold text-gray-900">Project</TableHead>
                      <TableHead className="font-semibold text-gray-900">Client</TableHead>
                      <TableHead className="font-semibold text-gray-900">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900">Budget</TableHead>
                      <TableHead className="font-semibold text-gray-900">Timeline</TableHead>
                      <TableHead className="font-semibold text-gray-900">Activities</TableHead>
                      <TableHead className="font-semibold text-gray-900">Equipment</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => {
                      const count = project._count || { activities: 0, equipmentAssignments: 0 }
                      return (
                        <TableRow key={project.id} className="border-gray-200 hover:bg-gray-50">
                          <TableCell className="py-4">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                <Link
                                  href={`/projects/${project.id}`}
                                  className="hover:text-blue-600 transition-colors"
                                >
                                  {project.name}
                                </Link>
                              </div>
                              <div className="text-sm text-gray-500 truncate">{project.projectCode}</div>
                              {project.location && (
                                <div className="flex items-center mt-1 text-sm text-gray-500">
                                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{project.location}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {project.client ? (
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                <span className="text-gray-900 truncate">{project.client.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">No client</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className={cn("text-xs font-medium", getStatusColor(project.status))}>
                              {project.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                              <span className="font-medium text-gray-900">{formatCurrency(project.budget)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {project.startDate && (
                              <div className="flex items-center text-sm">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-gray-900">{formatDate(project.startDate)}</div>
                                  {project.endDate && (
                                    <div className="text-gray-500">to {formatDate(project.endDate)}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-900 font-medium">{count.activities}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center">
                              <Wrench className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-900 font-medium">{count.equipmentAssignments}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/projects/${project.id}`} className="flex items-center">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/projects/${project.id}/edit`} className="flex items-center">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Project
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                {projects.map((project) => {
                  const count = project._count || { activities: 0, equipmentAssignments: 0 }
                  return (
                    <Card
                      key={project.id}
                      className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300"
                    >
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2">
                              <Badge className={cn("text-xs font-medium", getStatusColor(project.status))}>
                                {project.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <CardTitle className="text-base sm:text-lg font-medium text-gray-900 mb-1 line-clamp-2">
                              <Link href={`/projects/${project.id}`} className="hover:text-gray-700 transition-colors">
                                {project.name}
                              </Link>
                            </CardTitle>
                            <CardDescription className="text-gray-600 text-sm">{project.projectCode}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 sm:space-y-4">
                        {/* Client */}
                        {project.client && (
                          <div className="flex items-center space-x-3 text-sm">
                            <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-900 font-medium truncate">{project.client.name}</span>
                          </div>
                        )}

                        {/* Location */}
                        {project.location && (
                          <div className="flex items-center space-x-3 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 truncate">{project.location}</span>
                          </div>
                        )}

                        {/* Budget */}
                        <div className="flex items-center space-x-3 text-sm">
                          <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900 font-medium">{formatCurrency(project.budget)}</span>
                        </div>

                        {/* Timeline */}
                        {project.startDate && (
                          <div className="flex items-center space-x-3 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 truncate">
                              {formatDate(project.startDate)}
                              {project.endDate && ` - ${formatDate(project.endDate)}`}
                            </span>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">{count.activities}</span>
                            <span className="hidden xs:inline text-xs">activities</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Wrench className="h-4 w-4" />
                            <span className="text-xs sm:text-sm">{count.equipmentAssignments}</span>
                            <span className="hidden xs:inline text-xs">equipment</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent text-xs sm:text-sm"
                          >
                            <Link href={`/projects/${project.id}`}>
                              <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden xs:inline">View</span>
                              <span className="xs:hidden">View</span>
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent text-xs sm:text-sm"
                          >
                            <Link href={`/projects/${project.id}/edit`}>
                              <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden xs:inline">Edit</span>
                              <span className="xs:hidden">Edit</span>
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 order-2 sm:order-1">
              Page {currentPage} of {totalPages} ({total} total {total === 1 ? "project" : "projects"})
            </div>
            <div className="flex items-center space-x-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className="border-gray-300 hover:bg-gray-50 px-3 sm:px-4"
              >
                <span className="hidden xs:inline">Previous</span>
                <span className="xs:hidden">Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading}
                className="border-gray-300 hover:bg-gray-50 px-3 sm:px-4"
              >
                <span className="hidden xs:inline">Next</span>
                <span className="xs:hidden">Next</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
