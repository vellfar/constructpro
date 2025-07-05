"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  User,
  BarChart3,
  TrendingUp,
  DollarSign,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

interface ReportData {
  id: number
  name: string
  type: string
  data: any
  status: string
  createdAt: string
  generatedBy: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
}

export default function ReportViewPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [parsedData, setParsedData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      loadReport(Number.parseInt(params.id as string))
    }
  }, [params.id])

  const loadReport = async (reportId: number) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/reports/${reportId}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError("Report not found")
        } else {
          setError("Failed to load report")
        }
        return
      }

      const reportData = await response.json()
      setReport(reportData)

      // Parse the report data
      try {
        const parsed = typeof reportData.data === "string" ? JSON.parse(reportData.data) : reportData.data
        setParsedData(parsed)
      } catch (e) {
        console.error("Failed to parse report data:", e)
        setParsedData(reportData.data)
      }
    } catch (error) {
      console.error("Failed to load report:", error)
      setError("Failed to load report")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadReport = async () => {
    if (!report) return

    try {
      const res = await fetch(`/api/reports/${report.id}/download?format=pdf`)
      if (!res.ok) {
        toast.error("Failed to download PDF report.")
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const safeName = report && report.name ? report.name.replace(/[^a-z0-9]/gi, "_") : "report"
      const a = document.createElement("a")
      a.href = url
      a.download = `${safeName}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success("PDF report downloaded successfully!")
    } catch (error) {
      toast.error("Failed to download PDF report.")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "UGX",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderSummaryCards = (summary: any) => {
    if (!summary) return null

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(summary).map(([key, value]) => (
          <Card key={key} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {typeof value === "number"
                      ? key.includes("Rate") || key.includes("Percentage") || key.includes("Utilization")
                        ? `${value.toFixed(1)}%`
                        : key.includes("Amount") ||
                            key.includes("Budget") ||
                            key.includes("Cost") ||
                            key.includes("Spent")
                          ? formatCurrency(value)
                          : value.toLocaleString()
                      : String(value)}
                  </p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  {key.includes("budget") || key.includes("amount") || key.includes("cost") || key.includes("spent") ? (
                    <DollarSign className="h-4 w-4 text-gray-600" />
                  ) : key.includes("rate") || key.includes("percentage") || key.includes("utilization") ? (
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-gray-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderDataTable = (data: any[], title: string, maxRows = 10) => {
    if (!data || data.length === 0) return null

    const headers = Object.keys(data[0]).filter(
      (key) => !key.includes("Id") && key !== "id" && typeof data[0][key] !== "object",
    )

    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
          <CardDescription className="text-gray-600">
            Showing {Math.min(data.length, maxRows)} of {data.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header} className="font-medium text-gray-700">
                      {header.replace(/([A-Z])/g, " $1").trim()}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, maxRows).map((row, index) => (
                  <TableRow key={index}>
                    {headers.map((header) => (
                      <TableCell key={header} className="text-gray-900">
                        {header.includes("Date") && row[header]
                          ? new Date(row[header]).toLocaleDateString()
                          : header.includes("Amount") || header.includes("Budget") || header.includes("Cost")
                            ? typeof row[header] === "number"
                              ? formatCurrency(row[header])
                              : row[header]
                            : String(row[header] || "N/A")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderObjectData = (data: any, title: string) => {
    if (!data || typeof data !== "object") return null

    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                <span className="text-gray-900 font-semibold">
                  {typeof value === "number"
                    ? key.includes("Amount") || key.includes("Budget") || key.includes("Cost")
                      ? formatCurrency(value)
                      : value.toLocaleString()
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error || !report || !parsedData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || "Report not found"}</h2>
          <p className="text-gray-600 mb-4">The requested report could not be loaded.</p>
          <Button variant="outline" onClick={() => router.push("/reports")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button variant="ghost" size="sm" onClick={() => router.push("/reports")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <FileText className="h-5 w-5" />
            {report.name}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={downloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Report Header */}
        <Card className="border border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">{report.name}</CardTitle>
                <CardDescription className="text-base mt-2 text-gray-600">
                  {parsedData.type} - Generated on {formatDate(report.createdAt)}
                </CardDescription>
              </div>
              <Badge
                variant={report.status === "COMPLETED" ? "default" : "secondary"}
                className={report.status === "COMPLETED" ? "bg-green-100 text-green-800" : ""}
              >
                {report.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Generated: {formatDate(report.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  By: {report.generatedBy && report.generatedBy.firstName && report.generatedBy.lastName
                    ? `${report.generatedBy.firstName} ${report.generatedBy.lastName}`
                    : "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 capitalize">Type: {report.type.replace("-", " ")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Summary */}
        {parsedData.summary && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
            {renderSummaryCards(parsedData.summary)}
          </div>
        )}

        <Separator className="bg-gray-200" />

        {/* Report Details */}
        <div className="space-y-6">
          {/* Projects Data */}
          {parsedData.projects && renderDataTable(parsedData.projects, "Projects")}

          {/* Invoices Data */}
          {parsedData.detailedInvoices && renderDataTable(parsedData.detailedInvoices, "Invoices")}

          {/* Equipment Data */}
          {parsedData.detailedEquipment && renderDataTable(parsedData.detailedEquipment, "Equipment")}
          {parsedData.mostUtilizedEquipment &&
            renderDataTable(parsedData.mostUtilizedEquipment, "Most Utilized Equipment")}

          {/* Fuel Requests Data */}
          {parsedData.detailedRequests && renderDataTable(parsedData.detailedRequests, "Fuel Requests")}

          {/* Employee Data */}
          {parsedData.employees && renderDataTable(parsedData.employees, "Employees")}

          {/* Distribution Data */}
          {parsedData.invoicesByStatus && renderObjectData(parsedData.invoicesByStatus, "Invoices by Status")}
          {parsedData.equipmentByType && renderObjectData(parsedData.equipmentByType, "Equipment by Type")}
          {parsedData.equipmentByStatus && renderObjectData(parsedData.equipmentByStatus, "Equipment by Status")}
          {parsedData.fuelByType && renderObjectData(parsedData.fuelByType, "Fuel Consumption by Type")}
          {parsedData.departmentDistribution &&
            renderObjectData(parsedData.departmentDistribution, "Department Distribution")}
          {parsedData.positionDistribution &&
            renderObjectData(parsedData.positionDistribution, "Position Distribution")}

          {/* Project-specific Data */}
          {parsedData.fuelByProject && renderObjectData(parsedData.fuelByProject, "Fuel by Project")}
          {parsedData.invoicesByProject && renderObjectData(parsedData.invoicesByProject, "Invoices by Project")}

          {/* Safety Data */}
          {parsedData.projectSafetyScores && renderDataTable(parsedData.projectSafetyScores, "Project Safety Scores")}
          {parsedData.incidentsByType && renderObjectData(parsedData.incidentsByType, "Incidents by Type")}
          {parsedData.complianceMetrics && renderObjectData(parsedData.complianceMetrics, "Compliance Metrics")}

          {/* Recommendations */}
          {parsedData.recommendations && (
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {parsedData.recommendations.map((recommendation: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
