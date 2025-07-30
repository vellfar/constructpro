"use client"

import { useState, useEffect, useCallback, useRef } from "react"

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
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
  Download,
  Filter,
  Menu,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import type { FuelType, FuelUrgency } from "@prisma/client"
import { exportToCSV, exportToExcel, formatDataForExport } from "@/lib/export-utils"

export const viewport = {
  width: "device-width",
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
  odometerKm: string
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
  issuedTo: string
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
  // Track dialog open state for autoFocus
  const [createDialogJustOpened, setCreateDialogJustOpened] = useState(false);
  // Control Select open state for project/equipment (single state)
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [equipmentDropdownOpen, setEquipmentDropdownOpen] = useState(false);
  // Track dialog open state for autoFocus
  const { data: session, status } = useSession()

  // State management
  const [activeTab, setActiveTab] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false)
  const [selectedRequest, setSelectedRequest] = useState<FuelRequestWithRelations | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState<boolean>(false)
  const [showIssueDialog, setShowIssueDialog] = useState<boolean>(false)
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [showMobileActions, setShowMobileActions] = useState<boolean>(false)

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
    odometerKm: "",
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
    issuedTo: "",
    issuanceComments: "",
  })

  // Search state for dropdowns
  const [projectSearch, setProjectSearch] = useState("");
  const [equipmentSearch, setEquipmentSearch] = useState("");
  // Debounced search values
  const debouncedProjectSearch = useDebounce(projectSearch, 250);
  const debouncedEquipmentSearch = useDebounce(equipmentSearch, 250);
  // Refs for search inputs to keep focus on mobile
  const projectSearchRef = useRef<HTMLInputElement>(null);
  const equipmentSearchRef = useRef<HTMLInputElement>(null);

  // Filtered lists for dropdowns (debounced, live search, match name/code, case-insensitive)
  const filteredProjects = debouncedProjectSearch.trim() !== ""
    ? projects.filter((project) => {
        const search = debouncedProjectSearch.toLowerCase();
        return (
          project.name.toLowerCase().includes(search) ||
          (project.projectCode && project.projectCode.toLowerCase().includes(search))
        );
      })
    : projects;

  // Always search/filter over the full equipment list from the API (no slicing or limiting)
  const filteredEquipment = debouncedEquipmentSearch.trim() !== ""
    ? equipment.filter((item) => {
        const search = debouncedEquipmentSearch.toLowerCase();
        return (
          item.name.toLowerCase().includes(search) ||
          (item.equipmentCode && item.equipmentCode.toLowerCase().includes(search))
        );
      })
    : equipment;

  // Live search: user must open dropdown manually to select project/equipment

  // Ensure search input remains focused when dropdown opens
  useEffect(() => {
    if (projectDropdownOpen && projectSearchRef.current) {
      projectSearchRef.current.focus();
    }
  }, [projectDropdownOpen]);

  useEffect(() => {
    if (equipmentDropdownOpen && equipmentSearchRef.current) {
      equipmentSearchRef.current.focus();
    }
  }, [equipmentDropdownOpen]);

  // Fetch data function with retry and session error handling
  const fetchData = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 3;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    while (attempts < maxAttempts) {
      try {
        setLoading(true);
        setError(null);
        // Build query parameters
        const queryParams = new URLSearchParams({
          page: filters.page.toString(),
          limit: filters.pageSize.toString(),
          ...(filters.search && { search: filters.search }),
          ...(filters.status && filters.status !== EMPTY_VALUE && { status: filters.status }),
          ...(filters.projectId && filters.projectId !== EMPTY_VALUE && { projectId: filters.projectId }),
          ...(filters.equipmentId && filters.equipmentId !== EMPTY_VALUE && { equipmentId: filters.equipmentId }),
        });
        // Fetch all data in parallel
        const [fuelResponse, projectsResponse, equipmentResponse] = await Promise.all([
          fetch(`/api/fuel-requests?${queryParams}`).catch(() => null),
          fetch("/api/projects").catch(() => null),
          // Fetch all equipment with a large pageSize to get all equipment
          fetch("/api/equipment?page=1&pageSize=1000").catch(() => null),
        ]);
        // Handle session/network errors
        if (fuelResponse?.status === 401 || projectsResponse?.status === 401 || equipmentResponse?.status === 401) {
          setError("Session expired. Please log in again.");
          return;
        }
        if (!fuelResponse || !projectsResponse || !equipmentResponse) {
          throw new Error("Network error. Please check your connection.");
        }
        // Handle fuel requests
        if (fuelResponse.ok) {
          try {
            const fuelData = await fuelResponse.json();
            const requestsArray = Array.isArray(fuelData)
              ? fuelData
              : fuelData.data
                ? fuelData.data
                : fuelData.success && Array.isArray(fuelData.data)
                  ? fuelData.data
                  : [];
            setFuelRequests(requestsArray);
          } catch {
            setFuelRequests([]);
          }
        } else {
          setFuelRequests([]);
        }
        // Handle projects
        if (projectsResponse.ok) {
          try {
            const projectsData = await projectsResponse.json();
            const projectsArray = Array.isArray(projectsData)
              ? projectsData
              : projectsData.data
                ? projectsData.data
                : projectsData.success && Array.isArray(projectsData.data)
                  ? projectsData.data
                  : [];
            setProjects(projectsArray);
          } catch {
            setProjects([]);
          }
        } else {
          setProjects([]);
        }
        // Handle equipment
        if (equipmentResponse.ok) {
          try {
            const equipmentData = await equipmentResponse.json();
            const equipmentArray = Array.isArray(equipmentData)
              ? equipmentData
              : equipmentData.data
                ? equipmentData.data
                : equipmentData.success && Array.isArray(equipmentData.data)
                  ? equipmentData.data
                  : [];
            setEquipment(equipmentArray);
          } catch {
            setEquipment([]);
          }
        } else {
          setEquipment([]);
        }
        setLoading(false);
        return;
      } catch (error: any) {
        attempts++;
        if (attempts >= maxAttempts) {
          setError(error?.message || "Failed to fetch data");
          setFuelRequests([]);
          setProjects([]);
          setEquipment([]);
          setLoading(false);
          return;
        }
        await delay(1000 * attempts); // Exponential backoff
      }
    }
  }, [filters]);

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
        odometerKm: createForm.odometerKm ? Number.parseFloat(createForm.odometerKm) : null,
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
        window.location.reload()
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
        window.location.reload()
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
        window.location.reload()
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

  const handleExportCSV = () => {
    const exportData = formatDataForExport(filteredRequests, "fuel-requests")
    exportToCSV(exportData, `fuel-requests-${new Date().toISOString().split("T")[0]}`)
  }

  const handleExportExcel = () => {
    const exportData = formatDataForExport(filteredRequests, "fuel-requests")
    exportToExcel(exportData, `fuel-requests-${new Date().toISOString().split("T")[0]}`, "Fuel Requests")
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
    if (!createForm.odometerKm || Number.parseFloat(createForm.odometerKm) < 0) {
      toast.error("Please enter a valid odometer reading (km)")
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
    if (!issueForm.issuedTo.trim()) {
      toast.error("Please enter the name of the person the fuel is issued to")
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
      odometerKm: "",
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
      issuedTo: "",
      issuanceComments: "",
    })
  }

  // Filter functions
  const filteredRequests = fuelRequests.filter((request) => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const matchesSearch =
        request.requestNumber?.toLowerCase().includes(searchTerm) ||
        request.equipment?.name.toLowerCase().includes(searchTerm) ||
        request.project?.name.toLowerCase().includes(searchTerm) ||
        request.fuelType.toLowerCase().includes(searchTerm) ||
        `${request.requestedBy?.firstName} ${request.requestedBy?.lastName}`.toLowerCase().includes(searchTerm)

      if (!matchesSearch) return false
    }

    // Tab filter
    if (activeTab !== "all") {
      if (activeTab === "acknowledged") {
        if (request.status !== "ACKNOWLEDGED") return false;
      } else {
        if (request.status !== activeTab.toUpperCase()) return false;
      }
    }

    // Additional filters
    if (
      filters.projectId &&
      filters.projectId !== EMPTY_VALUE &&
      request.project?.id.toString() !== filters.projectId
    ) {
      return false
    }

    if (filters.fuelType && filters.fuelType !== EMPTY_VALUE && request.fuelType !== filters.fuelType) {
      return false
    }

    return true
  })

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const paginatedRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);

  // Tab counts
  const tabCounts = {
    all: fuelRequests.length,
    pending: fuelRequests.filter((r) => r.status === "PENDING").length,
    approved: fuelRequests.filter((r) => r.status === "APPROVED").length,
    issued: fuelRequests.filter((r) => r.status === "ISSUED").length,
    acknowledged: fuelRequests.filter((r) => r.status === "ACKNOWLEDGED").length,
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fuel management...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-white">
        <Card className="w-full max-w-md bg-white border border-gray-200 shadow-lg">
          <CardHeader className="bg-white">
            <CardTitle className="flex items-center text-gray-900">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <p className="text-gray-600 mb-4">You need to be logged in to access fuel management.</p>
            <Button
              onClick={() => (window.location.href = "/auth/login")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mobile Request Card Component
  const MobileRequestCard = ({ request }: { request: FuelRequestWithRelations }) => {
    const status = REQUEST_STATUSES.find((s) => s.value === request.status)
    const StatusIcon = status?.icon || Clock
    const urgency = URGENCY_LEVELS.find((u) => u.value === request.urgency)
    const shortRequestNumber = (request.requestNumber || `FR-${request.id}`).length > 10
      ? (request.requestNumber || `FR-${request.id}`).slice(0, 10) + '...'
      : (request.requestNumber || `FR-${request.id}`);

    // Desktop action logic reused for mobile
    // Use the same dropdown UI and logic as desktop, but render in the card
    return (
      <Card key={request.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4 text-gray-600" />
                <span className="font-semibold text-gray-900 text-sm">{shortRequestNumber}</span>
                <Badge variant={request.status === "APPROVED" ? "default" : "secondary"} className="bg-white border text-xs">
                  {status?.label || request.status}
                </Badge>
              </div>
              <span className="text-xs text-gray-500">{new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="text-gray-900 font-medium text-sm">{request.equipment?.name || "N/A"}</div>
            <div className="text-gray-500 text-xs">{request.equipment?.equipmentCode || ""}</div>
            <div className="text-gray-900 font-medium text-sm">{request.project?.name || "N/A"}</div>
            <div className="text-gray-500 text-xs">{request.project?.projectCode || ""}</div>
            <div className="text-sm">
              <div className="text-gray-900">Requested: {request.requestedQuantity}L</div>
              {request.approvedQuantity && (
                <div className="text-gray-500">Approved: {request.approvedQuantity}L</div>
              )}
              {request.issuedQuantity && (
                <div className="text-gray-500">Issued: {request.issuedQuantity}L</div>
              )}
            </div>
            {/* Actions for mobile (reuse desktop dropdown and logic) */}
            <div className="flex flex-wrap gap-2 mt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="border-gray-300">
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  {/* Approve/Reject action */}
                  {canApproveRequest && request.status === "PENDING" && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowApprovalDialog(true);
                      }}
                      className="text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Approve
                    </DropdownMenuItem>
                  )}
                  {/* Issue action */}
                  {canIssueRequest && request.status === "APPROVED" && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowIssueDialog(true);
                      }}
                      className="text-blue-700 hover:bg-blue-50"
                    >
                      <Fuel className="h-4 w-4 mr-2" /> Issue
                    </DropdownMenuItem>
                  )}
                  {/* Acknowledge action (if you have this on desktop) */}
                  {canIssueRequest && request.status === "ISSUED" && (
                    <DropdownMenuItem
                      onClick={() => {
                        // setSelectedRequest(request);
                        // setShowAcknowledgeDialog(true);
                      }}
                      className="text-yellow-700 hover:bg-yellow-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Acknowledge
                    </DropdownMenuItem>
                  )}
                  {/* Add more actions here as needed, matching desktop logic */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        {/* Mobile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Fuel className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Fuel Management</h1>
              <p className="text-xs text-gray-600 hidden sm:block">Track fuel requests and consumption</p>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden bg-white border-gray-300"
            >
              <Filter className="h-4 w-4" />
            </Button>

            <DropdownMenu open={showMobileActions} onOpenChange={setShowMobileActions}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden bg-white border-gray-300">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem onClick={fetchData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-2">
              <Button
                onClick={fetchData}
                variant="outline"
                size="sm"
                disabled={loading}
                className="bg-white border-gray-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="bg-white border-gray-300">
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} className="bg-white border-gray-300">
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </div>

            {canCreateRequest && (
              <Dialog
                open={showCreateDialog}
                onOpenChange={(open) => {
                  setShowCreateDialog(open);
                  setCreateDialogJustOpened(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">New Request</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md mx-auto bg-white max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900">Create Fuel Request</DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Submit a new fuel request for equipment
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Project *</label>
                      {/* Search input outside dropdown */}
                      <Input
                        ref={projectSearchRef}
                        type="text"
                        placeholder="Search projects..."
                        value={projectSearch}
                        onChange={e => setProjectSearch(e.target.value)}
                        className="w-full text-sm bg-white border-gray-300 mb-2"
                        inputMode="search"
                        autoFocus={createDialogJustOpened}
                      />
                      <Select
                        open={projectDropdownOpen}
                        onOpenChange={setProjectDropdownOpen}
                        value={createForm.projectId}
                        onValueChange={(value) => {
                          setCreateForm((prev) => ({ ...prev, projectId: value }));
                          setProjectDropdownOpen(false);
                          setProjectSearch("");
                        }}
                      >
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-56 overflow-y-auto">
                          <SelectItem value={EMPTY_VALUE}>Select project</SelectItem>
                          {filteredProjects.length > 0 ? (
                            filteredProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.name} {project.projectCode ? `(${project.projectCode})` : ""}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500 text-sm">No projects found</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>


                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Equipment *</label>
                      {/* Search input outside dropdown */}
                      <Input
                        ref={equipmentSearchRef}
                        type="text"
                        placeholder="Search equipment..."
                        value={equipmentSearch}
                        onChange={e => setEquipmentSearch(e.target.value)}
                        className="w-full text-sm bg-white border-gray-300 mb-2"
                        inputMode="search"
                        autoFocus={createDialogJustOpened}
                      />
                      <Select
                        open={equipmentDropdownOpen}
                        onOpenChange={setEquipmentDropdownOpen}
                        value={createForm.equipmentId}
                        onValueChange={(value) => {
                          setCreateForm((prev) => ({ ...prev, equipmentId: value }));
                          setEquipmentDropdownOpen(false);
                          setEquipmentSearch("");
                        }}
                      >
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Select equipment" />
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-56 overflow-y-auto">
                          <SelectItem value={EMPTY_VALUE}>Select equipment</SelectItem>
                          {filteredEquipment.length > 0 ? (
                            filteredEquipment.map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name} {item.equipmentCode ? `(${item.equipmentCode})` : ""}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500 text-sm">No equipment found</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Fuel Type *</label>
                        <Select
                          value={createForm.fuelType}
                          onValueChange={(value) => setCreateForm((prev) => ({ ...prev, fuelType: value }))}
                        >
                          <SelectTrigger className="bg-white border-gray-300">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value={EMPTY_VALUE}>Select type</SelectItem>
                            {FUEL_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Quantity (L) *</label>
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={createForm.requestedQuantity}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, requestedQuantity: e.target.value }))}
                          min="0"
                          step="0.1"
                          className="bg-white border-gray-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Odometer (km) *</label>
                        <Input
                          type="number"
                          placeholder="Enter odometer reading in km"
                          value={createForm.odometerKm}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, odometerKm: e.target.value }))}
                          min="0"
                          step="1"
                          className="bg-white border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Urgency *</label>
                      <Select
                        value={createForm.urgency}
                        onValueChange={(value) => setCreateForm((prev) => ({ ...prev, urgency: value }))}
                      >
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Select urgency level" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value={EMPTY_VALUE}>Select urgency</SelectItem>
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

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Justification *</label>
                      <Textarea
                        placeholder="Explain why this fuel is needed..."
                        value={createForm.justification}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, justification: e.target.value }))}
                        rows={3}
                        className="bg-white border-gray-300"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      disabled={submitting}
                      className="bg-white border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateRequest}
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Request
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <p className="text-red-700">Error: {error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters - Mobile Collapsible */}
        {showFilters && (
          <Card className="mb-6 lg:hidden bg-white border-gray-200">
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">Filters</CardTitle>
            </CardHeader>
            <CardContent className="bg-white space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-10 bg-white border-gray-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={filters.projectId || EMPTY_VALUE}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, projectId: value === EMPTY_VALUE ? "" : value }))
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
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
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Fuel Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
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
          </Card>
        )}

        {/* Desktop Filters */}
        <Card className="mb-6 hidden lg:block bg-white border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="text-gray-900">Filters</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search requests..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="pl-10 bg-white border-gray-300"
                  />
                </div>
              </div>
              <Select
                value={filters.projectId || EMPTY_VALUE}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, projectId: value === EMPTY_VALUE ? "" : value }))
                }
              >
                <SelectTrigger className="w-[180px] bg-white border-gray-300">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent className="bg-white">
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
                <SelectTrigger className="w-[150px] bg-white border-gray-300">
                  <SelectValue placeholder="Fuel Type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
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
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-5 min-w-[500px] bg-gray-100">
              <TabsTrigger value="all" className="data-[state=active]:bg-white">
                All ({tabCounts.all})
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-white">
                Pending ({tabCounts.pending})
              </TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-white">
                Approved ({tabCounts.approved})
              </TabsTrigger>
              <TabsTrigger value="issued" className="data-[state=active]:bg-white">
                Issued ({tabCounts.issued})
              </TabsTrigger>
              <TabsTrigger value="acknowledged" className="data-[state=active]:bg-white">
                Acknowledged ({tabCounts.acknowledged})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Loading requests...</p>
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card className="bg-white border-gray-200">
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No fuel requests found</h3>
                    <p className="text-gray-600 mb-4">
                      {activeTab === "all" ? "No requests have been created yet." : `No ${activeTab} requests found.`}
                    </p>
                    {canCreateRequest && activeTab === "all" && (
                      <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Request
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="lg:hidden space-y-4">
                  {paginatedRequests.map((request) => (
                    <MobileRequestCard key={request.id} request={request} />
                  ))}
                  {/* Pagination Controls - Mobile */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                      <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
                      <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                    </div>
                  )}
                </div>

                {/* Desktop View - Table */}
                <Card className="hidden lg:block bg-white border-gray-200">
                  <CardHeader className="bg-white">
                    <CardTitle className="text-gray-900">Fuel Requests ({filteredRequests.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200">
                            <TableHead className="text-gray-700 w-24 md:w-32 lg:w-36 xl:w-40 truncate">Request #</TableHead>
                            <TableHead className="text-gray-700">Equipment</TableHead>
                            <TableHead className="text-gray-700">Project</TableHead>
                            <TableHead className="text-gray-700">Fuel Type</TableHead>
                            <TableHead className="text-gray-700">Quantity</TableHead>
                            <TableHead className="text-gray-700">Status</TableHead>
                            <TableHead className="text-gray-700">Requested By</TableHead>
                            <TableHead className="text-gray-700">Date</TableHead>
                            <TableHead className="text-gray-700">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedRequests.map((request) => {
                            const status = REQUEST_STATUSES.find((s) => s.value === request.status)
                            const StatusIcon = status?.icon || Clock

                            return (
                              <TableRow key={request.id} className="border-gray-200 hover:bg-gray-50">
                                <TableCell className="font-medium text-gray-900 w-24 md:w-32 lg:w-36 xl:w-40 truncate max-w-[8ch] md:max-w-[12ch] lg:max-w-[16ch] xl:max-w-[20ch]">
                                  <span title={request.requestNumber || `FR-${request.id}`}>{(request.requestNumber || `FR-${request.id}`).length > 12 ? (request.requestNumber || `FR-${request.id}`).slice(0, 12) + '...' : (request.requestNumber || `FR-${request.id}`)}</span>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium text-gray-900">{request.equipment?.name || "N/A"}</div>
                                    <div className="text-sm text-gray-500">
                                      {request.equipment?.equipmentCode || ""}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium text-gray-900">{request.project?.name || "N/A"}</div>
                                    <div className="text-sm text-gray-500">{request.project?.projectCode || ""}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-white border-gray-300">
                                    {FUEL_TYPES.find((t) => t.value === request.fuelType)?.label || request.fuelType}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="text-gray-900">Requested: {request.requestedQuantity}L</div>
                                    {request.approvedQuantity && (
                                      <div className="text-gray-500">Approved: {request.approvedQuantity}L</div>
                                    )}
                                    {request.issuedQuantity && (
                                      <div className="text-gray-500">Issued: {request.issuedQuantity}L</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <StatusIcon className="h-4 w-4 mr-2 text-gray-600" />
                                    <Badge
                                      variant={request.status === "APPROVED" ? "default" : "secondary"}
                                      className="bg-white border"
                                    >
                                      {status?.label || request.status}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-900">
                                    {request.requestedBy?.firstName} {request.requestedBy?.lastName}
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-900">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-white">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
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

                                      {/* Acknowledge Receipt: Only requester, status ISSUED */}
                                      {request.status === "ISSUED" && session?.user?.id === String(request.requestedBy?.id) && (
                                        <DropdownMenuItem
                                          onClick={async () => {
                                            try {
                                              const response = await fetch(`/api/fuel-requests/${request.id}/acknowledge`, {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ acknowledgedQuantity: request.issuedQuantity, acknowledgmentComments: "Received in full" }),
                                              });
                                              const result = await response.json();
                                              if (response.ok && (result.success || result.id)) {
                                                toast.success(result.message || "Fuel receipt acknowledged successfully");
                                                window.location.reload();
                                              } else {
                                                toast.error(result.error || result.message || "Failed to acknowledge receipt");
                                              }
                                            } catch (error) {
                                              toast.error("Failed to acknowledge receipt");
                                            }
                                          }}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                          Acknowledge Receipt
                                        </DropdownMenuItem>
                                      )}

                                      {/* Complete Request: Only Admin, status ACKNOWLEDGED */}
                                      {request.status === "ACKNOWLEDGED" && session?.user?.role === "Admin" && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            fetch(`/api/fuel-requests/${request.id}/complete`, {
                                              method: "PATCH",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ completionComments: "Request completed" }),
                                            }).then(() => fetchData())
                                          }}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                                          Complete Request
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
                    </div>
                    {/* Pagination Controls - Desktop */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-4">
                        <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                        <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
                        <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Review Fuel Request</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedRequest && (
                <>
                  Request #{selectedRequest.requestNumber} - {selectedRequest.requestedQuantity}L of{" "}
                  {FUEL_TYPES.find((t) => t.value === selectedRequest.fuelType)?.label}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={approvalForm.action === "approve" ? "default" : "outline"}
                onClick={() => setApprovalForm((prev) => ({ ...prev, action: "approve", approved: true }))}
                className={
                  approvalForm.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-white border-gray-300"
                }
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant={approvalForm.action === "reject" ? "destructive" : "outline"}
                onClick={() => setApprovalForm((prev) => ({ ...prev, action: "reject", approved: false }))}
                className={approvalForm.action === "reject" ? "" : "bg-white border-gray-300"}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>

            {approvalForm.approved ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Approved Quantity (L) *</label>
                  <Input
                    type="number"
                    value={approvalForm.approvedQuantity || ""}
                    onChange={(e) =>
                      setApprovalForm((prev) => ({ ...prev, approvedQuantity: Number.parseFloat(e.target.value) || 0 }))
                    }
                    min="0"
                    step="0.1"
                    max={selectedRequest?.requestedQuantity}
                    className="bg-white border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Approval Comments</label>
                  <Textarea
                    value={approvalForm.approvalComments || ""}
                    onChange={(e) => setApprovalForm((prev) => ({ ...prev, approvalComments: e.target.value }))}
                    placeholder="Optional comments about the approval..."
                    rows={3}
                    className="bg-white border-gray-300"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Rejection Reason *</label>
                <Textarea
                  value={approvalForm.rejectionReason || ""}
                  onChange={(e) => setApprovalForm((prev) => ({ ...prev, rejectionReason: e.target.value }))}
                  placeholder="Explain why this request is being rejected..."
                  rows={3}
                  className="bg-white border-gray-300"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={submitting}
              className="bg-white border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveRequest}
              disabled={submitting}
              className={approvalForm.approved ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {approvalForm.approved ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Issue Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Issue Fuel</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedRequest && (
                <>
                  Issue fuel for Request #{selectedRequest.requestNumber} - Approved: {selectedRequest.approvedQuantity}L
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Issued Quantity (L) *</label>
              <Input
                type="number"
                value={issueForm.issuedQuantity || ""}
                onChange={(e) =>
                  setIssueForm((prev) => ({ ...prev, issuedQuantity: Number.parseFloat(e.target.value) || 0 }))
                }
                min="0"
                step="0.1"
                max={selectedRequest?.approvedQuantity || 0}
                className="bg-white border-gray-300"
              />
              {selectedRequest?.approvedQuantity && (
                <p className="text-sm text-gray-500">Maximum: {selectedRequest.approvedQuantity}L</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Issued To *</label>
              <Input
                type="text"
                placeholder="Enter recipient's name"
                value={issueForm.issuedTo}
                onChange={(e) => setIssueForm((prev) => ({ ...prev, issuedTo: e.target.value }))}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Issuance Comments</label>
              <Textarea
                value={issueForm.issuanceComments || ""}
                onChange={(e) => setIssueForm((prev) => ({ ...prev, issuanceComments: e.target.value }))}
                placeholder="Optional comments about the fuel issuance..."
                rows={3}
                className="bg-white border-gray-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowIssueDialog(false)}
              disabled={submitting}
              className="bg-white border-gray-300"
            >
              Cancel
            </Button>
            <Button onClick={handleIssueRequest} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Issue Fuel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
