"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  DollarSign,
  Loader2,
  Eye,
  Trash2,
  Calendar,
  User,
  AlertCircle,
  RefreshCw,
  Search,
  MoreVertical,
  Filter,
} from "lucide-react"
import { generateReport, getReports, deleteReport, getAllProjects } from "@/app/actions/report-actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

interface Report {
  id: number
  name: string
  type: string
  data: string | object
  status: string
  createdAt: string
  user?: {
    firstName: string
    lastName: string
  }
}

interface Project {
  id: number
  name: string
  projectCode?: string
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({ from: "", to: "" })
  const [selectedProject, setSelectedProject] = useState("all")
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProjectsLoading, setIsProjectsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const router = useRouter()

  const reportTypes = [
    {
      id: "project-summary",
      title: "Project Summary Report",
      description: "Overview of all projects with progress, budget, and timeline",
      icon: BarChart3,
      category: "Project",
    },
    {
      id: "financial",
      title: "Financial Report",
      description: "Budget utilization, expenses, and cost analysis",
      icon: DollarSign,
      category: "Financial",
    },
    {
      id: "equipment-utilization",
      title: "Equipment Utilization Report",
      description: "Equipment usage, efficiency, and maintenance costs",
      icon: TrendingUp,
      category: "Equipment",
    },
    {
      id: "fuel-consumption",
      title: "Fuel Consumption Report",
      description: "Fuel usage patterns and efficiency metrics",
      icon: BarChart3,
      category: "Fuel",
    },
    {
      id: "employee-productivity",
      title: "Employee Productivity Report",
      description: "Workforce allocation and productivity metrics",
      icon: TrendingUp,
      category: "HR",
    },
    {
      id: "safety-compliance",
      title: "Safety & Compliance Report",
      description: "Safety incidents, training records, and compliance status",
      icon: FileText,
      category: "Safety",
    },
  ]

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    await Promise.all([loadReports(), loadProjects()])
  }

  const loadReports = async () => {
    let attempts = 0;
    const maxAttempts = 3;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    while (attempts < maxAttempts) {
      try {
        setError(null);
        const reportsData = await getReports().catch(() => null);
        if (reportsData === null) {
          throw new Error("Network error. Please check your connection.");
        }
        setReports(
          (reportsData || []).map((report: any) => ({
            id: report.id,
            name: report.title,
            type: report.type,
            data: report.data,
            status: report.status || "COMPLETED",
            createdAt: typeof report.createdAt === "string" ? report.createdAt : report.createdAt?.toISOString?.() ?? "",
            user: report.user
              ? {
                  firstName: report.user.firstName,
                  lastName: report.user.lastName,
                }
              : undefined,
          }))
        );
        setIsLoading(false);
        return;
      } catch (error: any) {
        attempts++;
        if (attempts >= maxAttempts) {
          setError(error?.message || "Failed to load reports");
          setReports([]);
          setIsLoading(false);
          return;
        }
        await delay(1000 * attempts);
      }
    }
  }

  const loadProjects = async () => {
    let attempts = 0;
    const maxAttempts = 3;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    while (attempts < maxAttempts) {
      try {
        const projectsData = await getAllProjects().catch(() => null);
        if (projectsData === null) {
          throw new Error("Network error. Please check your connection.");
        }
        setProjects(projectsData || []);
        setIsProjectsLoading(false);
        return;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          setProjects([]);
          setIsProjectsLoading(false);
          return;
        }
        await delay(1000 * attempts);
      }
    }
  }

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(reportId)
    try {
      const formData = new FormData()
      formData.append("reportType", reportId)
      formData.append("dateFrom", dateRange.from)
      formData.append("dateTo", dateRange.to)
      formData.append("projectId", selectedProject)

      const result = await generateReport(formData)

      if (result.success) {
        await loadReports()
        toast.success("Report generated successfully!")
      } else {
        toast.error(result.error || "Failed to generate report")
      }
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Failed to generate report")
    } finally {
      setIsGenerating(null)
    }
  }

  const handleDeleteReport = async () => {
    if (!deleteTargetId) return
    try {
      await deleteReport(deleteTargetId)
      await loadReports()
      setShowDeleteDialog(false)
      setDeleteTargetId(null)
      toast.success("Report deleted successfully!")
    } catch (error) {
      toast.error("Failed to delete report")
    }
  }

  const downloadReport = async (reportId: number, format: "json" | "csv" | "pdf" = "json") => {
    try {
      const res = await fetch(`/api/reports/${reportId}/download?format=${format}`)
      if (!res.ok) {
        toast.error(`Failed to download report as ${format}`)
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `report-${reportId}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`Report downloaded as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error(`Failed to download report as ${format}`)
    }
  }

  const formatFileSize = (data: string | object) => {
    const dataString = typeof data === "string" ? data : JSON.stringify(data)
    const bytes = new Blob([dataString]).size
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200"
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatReportType = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Filter reports based on search and status
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      searchTerm === "" ||
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || report.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Mobile-Optimized Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Reports & Analytics</h1>
              <p className="text-sm text-gray-600 hidden sm:block">Generate and manage system reports</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={loadReports} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="generate" className="text-sm">
              Generate Reports
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-sm">
              Recent ({reports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            {/* Report Parameters Card */}
            <Card className="border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Report Parameters
                </CardTitle>
                <CardDescription>Configure the parameters for your reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom" className="text-sm font-medium text-gray-700">
                      Date From
                    </Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo" className="text-sm font-medium text-gray-700">
                      Date To
                    </Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project" className="text-sm font-medium text-gray-700">
                      Project
                    </Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {isProjectsLoading ? (
                          <SelectItem value="loading" disabled>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading...
                          </SelectItem>
                        ) : (
                          projects.map((project) => (
                            <SelectItem key={project.id} value={String(project.id)}>
                              {project.name} {project.projectCode && `(${project.projectCode})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Reports Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reportTypes.map((report) => {
                const IconComponent = report.icon
                const isLoading = isGenerating === report.id

                return (
                  <Card
                    key={report.id}
                    className="border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg text-gray-900 leading-tight">{report.title}</CardTitle>
                          <Badge variant="secondary" className="mt-2 bg-gray-100 text-gray-700 border-gray-200">
                            {report.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{report.description}</p>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Generate Report
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            {/* Search and Filter Controls */}
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Recent Reports
                </CardTitle>
                <CardDescription>
                  Previously generated reports available for download and viewing ({filteredReports.length} reports)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-5 w-5" />
                      <div>
                        <h3 className="font-medium">Error loading reports</h3>
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading reports...</span>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm || statusFilter !== "all"
                        ? "No reports match your filters"
                        : "No reports generated yet"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "Generate your first report from the Generate tab."}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                      <Button
                        variant="outline"
                        onClick={() => (document.querySelector('[value="generate"]') as HTMLElement | null)?.click()}
                        className="border-gray-300 hover:border-blue-300 hover:text-blue-600"
                      >
                        Generate Report
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Mobile Card View */}
                    <div className="block sm:hidden space-y-4">
                      {filteredReports.map((report) => (
                        <Card key={report.id} className="border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-gray-900 truncate">{report.name}</h3>
                                  <p className="text-sm text-gray-600">{formatReportType(report.type)}</p>
                                </div>
                              </div>
                              <Badge className={`${getStatusColor(report.status)} text-xs`}>{report.status}</Badge>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>
                                  {report.user?.firstName && report.user?.lastName
                                    ? `${report.user.firstName} ${report.user.lastName}`
                                    : "Unknown"}
                                </span>
                              </div>
                              <div>Size: {formatFileSize(report.data)}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Link href={`/reports/${report.id}`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full border-gray-300 bg-transparent">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="border-gray-300 bg-transparent">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => downloadReport(report.id, "csv")}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download CSV
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => downloadReport(report.id, "pdf")}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setDeleteTargetId(report.id)
                                      setShowDeleteDialog(true)
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop List View */}
                    <div className="hidden sm:block space-y-3">
                      {filteredReports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-gray-900 truncate">{report.name}</h3>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-1">
                                <span>{formatReportType(report.type)}</span>
                                <span>•</span>
                                <span>{formatFileSize(report.data)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(report.createdAt).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {report.user?.firstName && report.user?.lastName
                                    ? `${report.user.firstName} ${report.user.lastName}`
                                    : "Unknown"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                            <Link href={`/reports/${report.id}`}>
                              <Button variant="outline" size="sm" className="border-gray-300 bg-transparent">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="border-gray-300 bg-transparent">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => downloadReport(report.id, "csv")}>
                                  Download CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadReport(report.id, "pdf")}>
                                  Download PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDeleteTargetId(report.id)
                                setShowDeleteDialog(true)
                              }}
                              className="border-gray-300 hover:border-red-300 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Report
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone and the report data will be
              permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteTargetId(null)
              }}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteReport} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
