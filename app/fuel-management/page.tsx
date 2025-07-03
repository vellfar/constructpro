"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Send,
  Truck,
  AlertCircle,
  Fuel,
  Search,
  Loader2,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import type { FuelType, FuelUrgency } from "@prisma/client"
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
// Local types for this component
interface FuelRequestWithRelations {
  id: number
  requestNumber?: string
  fuelType: FuelType
  requestedQuantity: number
  approvedQuantity?: number | null
  issuedQuantity?: number | null
  status: string
  urgency: FuelUrgency
  justification: string
  createdAt: string
  updatedAt: string
  equipment?: {
    id: number
    name: string
    equipmentCode: string
    type: string
  } | null
  project?: {
    id: number
    name: string
    projectCode?: string | null
  } | null
  requestedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
}

interface ProjectOption {
  id: number
  name: string
  projectCode?: string | null
}

interface EquipmentOption {
  id: number
  name: string
  equipmentCode: string
}

interface FuelRequestFormData {
  projectId: string
  equipmentId: string
  fuelType: string
  requestedQuantity: string
  urgency: string
  justification: string
}

interface FuelRequestFilters {
  search: string
  status: string
  projectId: string
  equipmentId: string
  fuelType: string
  urgency: string
  sortBy: string
  sortOrder: "asc" | "desc"
  page: number
  pageSize: number
}

interface ApprovalData {
  approved: boolean
  approvedQuantity?: number
  approvalComments?: string
  rejectionReason?: string
}

interface IssueData {
  issuedQuantity: number
  issuanceComments?: string
}

const FUEL_TYPES = [
  { value: "DIESEL", label: "Diesel" },
  { value: "PETROL", label: "Petrol" },
  { value: "HYDRAULIC_OIL", label: "Hydraulic Oil" },
  { value: "ENGINE_OIL", label: "Engine Oil" },
] as const

const URGENCY_LEVELS = [
  { value: "LOW", label: "Low", color: "bg-green-500" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-500" },
  { value: "HIGH", label: "High", color: "bg-orange-500" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-500" },
] as const

const REQUEST_STATUSES = [
  { value: "PENDING", label: "Pending", icon: Clock, color: "bg-yellow-500" },
  { value: "APPROVED", label: "Approved", icon: CheckCircle, color: "bg-green-500" },
  { value: "REJECTED", label: "Rejected", icon: XCircle, color: "bg-red-500" },
  { value: "ISSUED", label: "Issued", icon: Truck, color: "bg-blue-500" },
  { value: "ACKNOWLEDGED", label: "Acknowledged", icon: CheckCircle, color: "bg-purple-500" },
  { value: "COMPLETED", label: "Completed", icon: CheckCircle, color: "bg-gray-500" },
  { value: "CANCELLED", label: "Cancelled", icon: XCircle, color: "bg-gray-400" },
] as const

const EMPTY_VALUE = "__NONE__"

export default function FuelManagementPage() {
  const { data: session, status } = useSession()

  // State management
  const [activeTab, setActiveTab] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false)
  const [selectedRequest, setSelectedRequest] = useState<FuelRequestWithRelations | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState<boolean>(false)
  const [showIssueDialog, setShowIssueDialog] = useState<boolean>(false)

  // Data state
  const [fuelRequests, setFuelRequests] = useState<FuelRequestWithRelations[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [equipment, setEquipment] = useState<EquipmentOption[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [filters, setFilters] = useState<FuelRequestFilters>({
    search: "",
    status: "",
    projectId: "",
    equipmentId: "",
    fuelType: "",
    urgency: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    pageSize: 50,
  })

  // Form state
  const [createForm, setCreateForm] = useState<FuelRequestFormData>({
    projectId: EMPTY_VALUE,
    equipmentId: EMPTY_VALUE,
    fuelType: EMPTY_VALUE,
    requestedQuantity: "",
    urgency: EMPTY_VALUE,
    justification: "",
  })

  // Approval form state
  const [approvalForm, setApprovalForm] = useState<ApprovalData & { action: "approve" | "reject" }>({
    approved: true,
    action: "approve",
    approvedQuantity: 0,
    approvalComments: "",
    rejectionReason: "",
  })

  // Issue form state
  const [issueForm, setIssueForm] = useState<IssueData>({
    issuedQuantity: 0,
    issuanceComments: "",
  })

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔍 Fetching fuel management data...")

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && filters.status !== EMPTY_VALUE && { status: filters.status }),
        ...(filters.projectId && filters.projectId !== EMPTY_VALUE && { projectId: filters.projectId }),
        ...(filters.equipmentId && filters.equipmentId !== EMPTY_VALUE && { equipmentId: filters.equipmentId }),
      })

      // Fetch all data in parallel
      const [fuelResponse, projectsResponse, equipmentResponse] = await Promise.all([
        fetch(`/api/fuel-requests?${queryParams}`).catch(() => null),
        fetch("/api/projects").catch(() => null),
        fetch("/api/equipment").catch(() => null),
      ])

      // Handle fuel requests
      if (fuelResponse?.ok) {
        try {
          const fuelData = await fuelResponse.json()
          // Handle both direct array and wrapped response formats
          const requestsArray = Array.isArray(fuelData)
            ? fuelData
            : fuelData.data
              ? fuelData.data
              : fuelData.success && Array.isArray(fuelData.data)
                ? fuelData.data
                : []

          setFuelRequests(requestsArray)
          console.log("✅ Fuel requests loaded:", requestsArray.length)
        } catch (parseError) {
          console.warn("⚠️ Failed to parse fuel requests response")
          setFuelRequests([])
        }
      } else {
        console.warn("⚠️ Failed to fetch fuel requests")
        setFuelRequests([])
      }

      // Handle projects
      if (projectsResponse?.ok) {
        try {
          const projectsData = await projectsResponse.json()
          // Handle both direct array and wrapped response formats
          const projectsArray = Array.isArray(projectsData)
            ? projectsData
            : projectsData.data
              ? projectsData.data
              : projectsData.success && Array.isArray(projectsData.data)
                ? projectsData.data
                : []

          setProjects(projectsArray)
          console.log("✅ Projects loaded:", projectsArray.length)
        } catch (parseError) {
          console.warn("⚠️ Failed to parse projects response")
          setProjects([])
        }
      } else {
        console.warn("⚠️ Failed to fetch projects")
        setProjects([])
      }

      // Handle equipment
      if (equipmentResponse?.ok) {
        try {
          const equipmentData = await equipmentResponse.json()
          // Handle both direct array and wrapped response formats
          const equipmentArray = Array.isArray(equipmentData)
            ? equipmentData
            : equipmentData.data
              ? equipmentData.data
              : equipmentData.success && Array.isArray(equipmentData.data)
                ? equipmentData.data
                : []

          setEquipment(equipmentArray)
          console.log("✅ Equipment loaded:", equipmentArray.length)
        } catch (parseError) {
          console.warn("⚠️ Failed to parse equipment response")
          setEquipment([])
        }
      } else {
        console.warn("⚠️ Failed to fetch equipment")
        setEquipment([])
      }
    } catch (error) {
      console.error("❌ Error fetching data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch data")
      // Set empty arrays as fallback
      setFuelRequests([])
      setProjects([])
      setEquipment([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Load data on mount and filter changes
  useEffect(() => {
    if (session?.user) {
      fetchData()
    }
  }, [fetchData, session])

  // Permission checks
  const canCreateRequest = !!session?.user
  const canApproveRequest = session?.user?.role === "Admin" || session?.user?.role === "Project Manager"
  const canIssueRequest = session?.user?.role === "Admin" || session?.user?.role === "Store Manager"

  // Handle create fuel request
  const handleCreateRequest = async () => {
    if (!validateCreateForm()) return

    try {
      setSubmitting(true)
      console.log("🚀 Creating fuel request:", createForm)

      const requestData = {
        projectId: createForm.projectId === EMPTY_VALUE ? null : Number.parseInt(createForm.projectId),
        equipmentId: createForm.equipmentId === EMPTY_VALUE ? null : Number.parseInt(createForm.equipmentId),
        fuelType: createForm.fuelType as FuelType,
        requestedQuantity: Number.parseFloat(createForm.requestedQuantity),
        urgency: createForm.urgency as FuelUrgency,
        justification: createForm.justification,
      }

      const response = await fetch("/api/fuel-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (response.ok && (result.success || result.id)) {
        toast.success("Fuel request created successfully")
        setShowCreateDialog(false)
        resetCreateForm()
        fetchData() // Refresh data
      } else {
        toast.error(result.error || result.message || "Failed to create fuel request")
      }
    } catch (error) {
      console.error("❌ Error creating fuel request:", error)
      toast.error("Failed to create fuel request")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle approve/reject request
  const handleApproveRequest = async () => {
    if (!selectedRequest) return
    if (!validateApprovalForm()) return

    try {
      setSubmitting(true)
      console.log("🔄 Processing fuel request:", selectedRequest.id, approvalForm)

      const response = await fetch(`/api/fuel-requests/${selectedRequest.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved: approvalForm.approved,
          approvedQuantity: approvalForm.approved ? approvalForm.approvedQuantity : undefined,
          approvalComments: approvalForm.approvalComments,
          rejectionReason: !approvalForm.approved ? approvalForm.rejectionReason : undefined,
        }),
      })

      const result = await response.json()

      if (response.ok && (result.success || result.id)) {
        toast.success(result.message || `Fuel request ${approvalForm.approved ? "approved" : "rejected"} successfully`)
        setShowApprovalDialog(false)
        setSelectedRequest(null)
        resetApprovalForm()
        fetchData() // Refresh data
      } else {
        toast.error(result.error || result.message || "Failed to process request")
      }
    } catch (error) {
      console.error("❌ Error processing fuel request:", error)
      toast.error("Failed to process fuel request")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle issue fuel
  const handleIssueRequest = async () => {
    if (!selectedRequest) return
    if (!validateIssueForm()) return

    try {
      setSubmitting(true)
      console.log("📦 Issuing fuel for request:", selectedRequest.id, issueForm)

      const response = await fetch(`/api/fuel-requests/${selectedRequest.id}/issue`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issueForm),
      })

      const result = await response.json()

      if (response.ok && (result.success || result.id)) {
        toast.success(result.message || "Fuel issued successfully")
        setShowIssueDialog(false)
        setSelectedRequest(null)
        resetIssueForm()
        fetchData() // Refresh data
      } else {
        toast.error(result.error || result.message || "Failed to issue fuel")
      }
    } catch (error) {
      console.error("❌ Error issuing fuel:", error)
      toast.error("Failed to issue fuel")
    } finally {
      setSubmitting(false)
    }
  }

  // Validation functions
  const validateCreateForm = (): boolean => {
    if (createForm.projectId === EMPTY_VALUE) {
      toast.error("Please select a project")
      return false
    }
    if (createForm.equipmentId === EMPTY_VALUE) {
      toast.error("Please select equipment")
      return false
    }
    if (createForm.fuelType === EMPTY_VALUE) {
      toast.error("Please select fuel type")
      return false
    }
    if (!createForm.requestedQuantity || Number.parseFloat(createForm.requestedQuantity) <= 0) {
      toast.error("Please enter a valid quantity")
      return false
    }
    if (createForm.urgency === EMPTY_VALUE) {
      toast.error("Please select urgency level")
      return false
    }
    if (!createForm.justification.trim()) {
      toast.error("Please provide justification")
      return false
    }
    return true
  }

  const validateApprovalForm = (): boolean => {
    if (approvalForm.approved && (!approvalForm.approvedQuantity || approvalForm.approvedQuantity <= 0)) {
      toast.error("Please enter approved quantity")
      return false
    }
    if (!approvalForm.approved && !approvalForm.rejectionReason?.trim()) {
      toast.error("Please provide rejection reason")
      return false
    }
    return true
  }

  const validateIssueForm = (): boolean => {
    if (!issueForm.issuedQuantity || issueForm.issuedQuantity <= 0) {
      toast.error("Please enter issued quantity")
      return false
    }
    if (selectedRequest?.approvedQuantity && issueForm.issuedQuantity > selectedRequest.approvedQuantity) {
      toast.error("Issued quantity cannot exceed approved quantity")
      return false
    }
    return true
  }

  // Reset form functions
  const resetCreateForm = () => {
    setCreateForm({
      projectId: EMPTY_VALUE,
      equipmentId: EMPTY_VALUE,
      fuelType: EMPTY_VALUE,
      requestedQuantity: "",
      urgency: EMPTY_VALUE,
      justification: "",
    })
  }

  const resetApprovalForm = () => {
    setApprovalForm({
      approved: true,
      action: "approve",
      approvedQuantity: 0,
      approvalComments: "",
      rejectionReason: "",
    })
  }

  const resetIssueForm = () => {
    setIssueForm({
      issuedQuantity: 0,
      issuanceComments: "",
    })
  }

  // Filter functions
  const filteredRequests = fuelRequests.filter((request) => {
    if (activeTab === "all") return true
    return request.status === activeTab.toUpperCase()
  })

  // Tab counts
  const tabCounts = {
    all: fuelRequests.length,
    pending: fuelRequests.filter((r) => r.status === "PENDING").length,
    approved: fuelRequests.filter((r) => r.status === "APPROVED").length,
    issued: fuelRequests.filter((r) => r.status === "ISSUED").length,
    completed: fuelRequests.filter((r) => r.status === "COMPLETED").length,
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">You need to be logged in to access fuel management.</p>
            <Button onClick={() => (window.location.href = "/auth/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <Fuel className="h-8 w-8 mr-3 text-blue-600" />
            Fuel Management
          </h2>
          <p className="text-muted-foreground">Manage fuel requests and track consumption across projects</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canCreateRequest && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Fuel Request</DialogTitle>
                  <DialogDescription>Submit a new fuel request for equipment</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Project *</label>
                    <div className="col-span-3">
                      <Select
                        value={createForm.projectId}
                        onValueChange={(value) => setCreateForm((prev) => ({ ...prev, projectId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_VALUE}>Select project</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name} {project.projectCode && `(${project.projectCode})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Equipment *</label>
                    <div className="col-span-3">
                      <Select
                        value={createForm.equipmentId}
                        onValueChange={(value) => setCreateForm((prev) => ({ ...prev, equipmentId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_VALUE}>Select equipment</SelectItem>
                          {equipment.map((item) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name} ({item.equipmentCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Fuel Type *</label>
                    <div className="col-span-3">
                      <Select
                        value={createForm.fuelType}
                        onValueChange={(value) => setCreateForm((prev) => ({ ...prev, fuelType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_VALUE}>Select fuel type</SelectItem>
                          {FUEL_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Quantity (L) *</label>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Enter quantity in liters"
                        value={createForm.requestedQuantity}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, requestedQuantity: e.target.value }))}
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Urgency *</label>
                    <div className="col-span-3">
                      <Select
                        value={createForm.urgency}
                        onValueChange={(value) => setCreateForm((prev) => ({ ...prev, urgency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_VALUE}>Select urgency level</SelectItem>
                          {URGENCY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full ${level.color} mr-2`} />
                                {level.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Justification *</label>
                    <div className="col-span-3">
                      <Textarea
                        placeholder="Explain why this fuel is needed..."
                        value={createForm.justification}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, justification: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRequest} disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <p className="text-red-700">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters 
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={filters.projectId || EMPTY_VALUE}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, projectId: value === EMPTY_VALUE ? "" : value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_VALUE}>All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.fuelType || EMPTY_VALUE}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, fuelType: value === EMPTY_VALUE ? "" : value }))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Fuel Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_VALUE}>All Types</SelectItem>
                {FUEL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card> */}

      {/* Dynamic Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({tabCounts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({tabCounts.approved})</TabsTrigger>
          <TabsTrigger value="issued">Issued ({tabCounts.issued})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({tabCounts.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Fuel Requests ({filteredRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading requests...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No fuel requests found</p>
                  {canCreateRequest && (
                    <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Request
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request #</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => {
                      const status = REQUEST_STATUSES.find((s) => s.value === request.status)
                      const StatusIcon = status?.icon || Clock

                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.requestNumber || `FR-${request.id}`}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.equipment?.name || "N/A"}</div>
                              <div className="text-sm text-muted-foreground">
                                {request.equipment?.equipmentCode || ""}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.project?.name || "N/A"}</div>
                              <div className="text-sm text-muted-foreground">{request.project?.projectCode || ""}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {FUEL_TYPES.find((t) => t.value === request.fuelType)?.label || request.fuelType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Requested: {request.requestedQuantity}L</div>
                              {request.approvedQuantity && (
                                <div className="text-muted-foreground">Approved: {request.approvedQuantity}L</div>
                              )}
                              {request.issuedQuantity && (
                                <div className="text-muted-foreground">Issued: {request.issuedQuantity}L</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <StatusIcon className="h-4 w-4 mr-2" />
                              <Badge variant={request.status === "APPROVED" ? "default" : "secondary"}>
                                {status?.label || request.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {request.requestedBy?.firstName} {request.requestedBy?.lastName}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />

                                {/* Role-based actions */}
                                {request.status === "PENDING" && canApproveRequest && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRequest(request)
                                      setApprovalForm((prev) => ({
                                        ...prev,
                                        approvedQuantity: request.requestedQuantity,
                                      }))
                                      setShowApprovalDialog(true)
                                    }}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve/Reject
                                  </DropdownMenuItem>
                                )}

                                {request.status === "APPROVED" && canIssueRequest && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRequest(request)
                                      setIssueForm((prev) => ({
                                        ...prev,
                                        issuedQuantity: request.approvedQuantity || 0,
                                      }))
                                      setShowIssueDialog(true)
                                    }}
                                  >
                                    <Send className="mr-2 h-4 w-4" />
                                    Issue Fuel
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Fuel Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  Request #{selectedRequest.requestNumber} - {selectedRequest.requestedQuantity}L of{" "}
                  {FUEL_TYPES.find((t) => t.value === selectedRequest.fuelType)?.label}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-4">
              <Button
                variant={approvalForm.action === "approve" ? "default" : "outline"}
                onClick={() => setApprovalForm((prev) => ({ ...prev, action: "approve", approved: true }))}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant={approvalForm.action === "reject" ? "destructive" : "outline"}
                onClick={() => setApprovalForm((prev) => ({ ...prev, action: "reject", approved: false }))}
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>

            {approvalForm.approved ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Approved Quantity (L) *</label>
                  <Input
                    type="number"
                    value={approvalForm.approvedQuantity || ""}
                    onChange={(e) =>
                      setApprovalForm((prev) => ({ ...prev, approvedQuantity: Number.parseFloat(e.target.value) || 0 }))
                    }
                    min="0"
                    step="0.1"
                    max={selectedRequest?.requestedQuantity}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Approval Comments</label>
                  <Textarea
                    value={approvalForm.approvalComments || ""}
                    onChange={(e) => setApprovalForm((prev) => ({ ...prev, approvalComments: e.target.value }))}
                    placeholder="Optional comments about the approval..."
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  value={approvalForm.rejectionReason || ""}
                  onChange={(e) => setApprovalForm((prev) => ({ ...prev, rejectionReason: e.target.value }))}
                  placeholder="Explain why this request is being rejected..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveRequest}
              disabled={submitting}
              variant={approvalForm.approved ? "default" : "destructive"}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {approvalForm.approved ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Issue Fuel</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  Issue fuel for Request #{selectedRequest.requestNumber} - Approved: {selectedRequest.approvedQuantity}
                  L
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Issued Quantity (L) *</label>
              <Input
                type="number"
                value={issueForm.issuedQuantity || ""}
                onChange={(e) =>
                  setIssueForm((prev) => ({ ...prev, issuedQuantity: Number.parseFloat(e.target.value) || 0 }))
                }
                min="0"
                step="0.1"
                max={selectedRequest?.approvedQuantity || 0}
              />
              {selectedRequest?.approvedQuantity && (
                <p className="text-sm text-muted-foreground">Maximum: {selectedRequest.approvedQuantity}L</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Issuance Comments</label>
              <Textarea
                value={issueForm.issuanceComments || ""}
                onChange={(e) => setIssueForm((prev) => ({ ...prev, issuanceComments: e.target.value }))}
                placeholder="Optional comments about the fuel issuance..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIssueDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleIssueRequest} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Issue Fuel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
