"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Filter, BarChart3, TrendingUp, DollarSign, Loader2, Eye, Trash2 } from "lucide-react"
import { generateReport, getReports, deleteReport, getAllProjects } from "@/app/actions/report-actions"
import { useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

  const [dateRange, setDateRange] = useState({ from: "", to: "" })
  const [selectedProject, setSelectedProject] = useState("all")
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<any[]>([])
  const [isProjectsLoading, setIsProjectsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const router = useRouter()

  const reportTypes = [
    {
      id: "project-summary",
      title: "Project Summary Report",
      description: "Overview of all projects with progress, budget, and timeline",
      icon: BarChart3,
      category: "project",
    },
    {
      id: "financial",
      title: "Financial Report",
      description: "Budget utilization, expenses, and cost analysis",
      icon: DollarSign,
      category: "financial",
    },
    {
      id: "equipment-utilization",
      title: "Equipment Utilization Report",
      description: "Equipment usage, efficiency, and maintenance costs",
      icon: TrendingUp,
      category: "equipment",
    },
    {
      id: "fuel-consumption",
      title: "Fuel Consumption Report",
      description: "Fuel usage patterns and efficiency metrics",
      icon: BarChart3,
      category: "fuel",
    },
    {
      id: "employee-productivity",
      title: "Employee Productivity Report",
      description: "Workforce allocation and productivity metrics",
      icon: TrendingUp,
      category: "hr",
    },
    {
      id: "safety-compliance",
      title: "Safety & Compliance Report",
      description: "Safety incidents, training records, and compliance status",
      icon: FileText,
      category: "safety",
    },
  ]

  useEffect(() => {
    loadReports()
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setIsProjectsLoading(true)
    try {
      const projectsData = await getAllProjects()
      setProjects(projectsData)
    } catch (error) {
      console.error("Failed to load projects:", error)
    } finally {
      setIsProjectsLoading(false)
    }
  }

  const loadReports = async () => {
    try {
      const reportsData = await getReports()
      setReports(reportsData)
    } catch (error) {
      console.error("Failed to load reports:", error)
    } finally {
      setIsLoading(false)
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
        alert("Report generated successfully!")
      } else {
        alert(result.error || "Failed to generate report. Please try again.")
      }
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Failed to generate report. Please try again.")
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
      alert("Report deleted successfully!")
    } catch (error) {
      alert("Failed to delete report. Please try again.")
    }
  }

  const downloadReport = async (reportId: number, format: 'json' | 'csv' | 'pdf' = 'json') => {
    try {
      const res = await fetch(`/api/reports/${reportId}/download?format=${format}`)
      if (!res.ok) {
        alert(`Failed to download report as ${format}.`)
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
    } catch (error) {
      alert(`Failed to download report as ${format}.`)
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

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="flex items-center gap-2 font-semibold">
          <FileText className="h-5 w-5" />
          Reports
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={loadReports}>
            <Filter className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList>
            <TabsTrigger value="generate">Generate Reports</TabsTrigger>
            <TabsTrigger value="recent">Recent Reports ({reports.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            {/* Report Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Report Parameters</CardTitle>
                <CardDescription>Configure the parameters for your reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">Date From</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo">Date To</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project">Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {isProjectsLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        projects.map((project) => (
                          <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Reports */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reportTypes.map((report) => {
                const IconComponent = report.icon
                const isLoading = isGenerating === report.id

                return (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {report.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                      <Button className="w-full" onClick={() => handleGenerateReport(report.id)} disabled={isLoading}>
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
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Previously generated reports available for download and viewing</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No reports generated yet. Generate your first report from the Generate tab.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{report.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{report.type}</span>
                              <span>•</span>
                              <span>{formatFileSize(report.data)}</span>
                              <span>•</span>
                              <span>Generated on {new Date(report.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>
                                By {report.user?.firstName && report.user?.lastName
                                  ? `${report.user.firstName} ${report.user.lastName}`
                                  : "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={report.status === "COMPLETED" ? "default" : "secondary"}>
                            {report.status}
                          </Badge>
                          <Link href={`/reports/${report.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {/* Removed JSON download button */}
                          <Button variant="outline" size="sm" title="Download CSV" onClick={() => downloadReport(report.id, 'csv')}>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">CSV</span>
                          </Button>
                          <Button variant="outline" size="sm" title="Download PDF" onClick={() => downloadReport(report.id, 'pdf')}>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">PDF</span>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setShowDeleteDialog(true); setDeleteTargetId(report.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Delete Report</h2>
            <p className="mb-6">Are you sure you want to delete this report? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteTargetId(null); }}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteReport}>Delete</Button>
            </div>
          </div>
        </div>
      )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}