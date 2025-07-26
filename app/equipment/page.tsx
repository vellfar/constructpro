"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Truck, Loader2, Download, MoreVertical, ArrowUpDown, Eye, Edit } from "lucide-react"
import BulkUploadDialog from "./bulk-upload-dialog"
import Link from "next/link"
import { getEquipment } from "@/app/actions/equipment-actions"
import { EquipmentActions } from "@/components/equipment-actions"
import { exportToCSV, exportToExcel, formatDataForExport } from "@/lib/export-utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

interface Equipment {
  id: number
  name: string
  type: string
  make: string
  model: string
  status: string
  equipmentCode: string
  yearOfManufacture: number | null
  ownership: string
  size: string | null
  unit: string | null
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  useEffect(() => {
    // Set view mode based on screen size
    const handleResize = () => {
      setViewMode(window.innerWidth >= 768 ? "table" : "grid")
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const result = await getEquipment()
        if (result.success && result.data) {
          setEquipment(
            result.data.map((item: any) => ({
              ...item,
              size: item.size !== null && item.size !== undefined ? String(item.size) : null,
            })),
          )
        } else {
          setError(result.error || "Failed to load equipment")
        }
      } catch (err) {
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchEquipment()
  }, [])

  const handleExportCSV = () => {
    const exportData = formatDataForExport(equipment, "equipment")
    exportToCSV(exportData, `equipment-${new Date().toISOString().split("T")[0]}`)
  }

  const handleExportExcel = () => {
    const exportData = formatDataForExport(equipment, "equipment")
    exportToExcel(exportData, `equipment-${new Date().toISOString().split("T")[0]}`, "Equipment")
  }

  // Filter equipment based on search and filters
  const filteredEquipment =
    equipment?.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipmentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === "all" || item.type.toLowerCase() === typeFilter.toLowerCase()
      const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesType && matchesStatus
    }) || []

  const operationalEquipment = filteredEquipment.filter((e) => e.status === "OPERATIONAL")
  const maintenanceEquipment = filteredEquipment.filter((e) => e.status === "UNDER_MAINTENANCE")
  const outOfServiceEquipment = filteredEquipment.filter((e) => e.status === "OUT_OF_SERVICE")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPERATIONAL":
        return "bg-green-100 text-green-800 border-green-200"
      case "UNDER_MAINTENANCE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "OUT_OF_SERVICE":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getOwnershipColor = (ownership: string) => {
    switch (ownership) {
      case "OWNED":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "RENTED":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "LEASED":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  function EquipmentTable({ equipment: equipmentList }: { equipment: Equipment[] }) {
    if (!equipmentList || equipmentList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-lg border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Truck className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No equipment found</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-sm">
            {searchTerm || typeFilter !== "all" || statusFilter !== "all"
              ? "No equipment matches your current filters. Try adjusting your search criteria."
              : "Get started by adding your first piece of equipment to track and manage your construction assets."}
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/equipment/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <div className="flex items-center">
                  Equipment
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Make</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ownership</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipmentList.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <Link href={`/equipment/${item.id}`} className="hover:text-blue-600 transition-colors">
                    {item.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{item.type}</span>
                    {item.make && item.model && (
                      <span className="text-gray-500">
                        {" "}
                        • {item.make} {item.model}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{item.equipmentCode}</span>
                </TableCell>
                <TableCell>{item.yearOfManufacture || "N/A"}</TableCell>
                <TableCell>
                  <Badge className={`text-xs font-medium border ${getStatusColor(item.status)}`}>
                    {item.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${getOwnershipColor(item.ownership)}`}>
                    {item.ownership}
                  </Badge>
                </TableCell>
                <TableCell>{item.size ? `${item.size} ${item.unit || ""}`.trim() : "N/A"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Link href={`/equipment/${item.id}`}>
                        <span className="sr-only">View</span>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Link href={`/equipment/${item.id}/edit`}>
                        <span className="sr-only">Edit</span>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <EquipmentActions equipment={item} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  function EquipmentGrid({ equipment: equipmentList }: { equipment: Equipment[] }) {
    if (!equipmentList || equipmentList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-lg border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Truck className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No equipment found</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-sm">
            {searchTerm || typeFilter !== "all" || statusFilter !== "all"
              ? "No equipment matches your current filters. Try adjusting your search criteria."
              : "Get started by adding your first piece of equipment to track and manage your construction assets."}
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/equipment/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {equipmentList.map((item) => (
          <Card
            key={item.id}
            className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group"
          >
            {/* Card Header with Image Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 relative border-b border-gray-200">
              <div className="absolute inset-0 flex items-center justify-center">
                <Truck className="h-12 w-12 text-gray-300 group-hover:text-blue-400 transition-colors" />
              </div>

              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <Badge className={`text-xs font-medium border ${getStatusColor(item.status)}`}>
                  {item.status.replace("_", " ")}
                </Badge>
              </div>

              {/* Actions Menu */}
              <div className="absolute top-3 left-3">
                <EquipmentActions equipment={item} />
              </div>
            </div>

            {/* Card Content */}
            <CardContent className="p-4 sm:p-5">
              <div className="space-y-4">
                {/* Equipment Name and Type */}
                <div className="space-y-1">
                  <Link href={`/equipment/${item.id}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {item.type} • {item.make} {item.model}
                  </p>
                </div>

                {/* Equipment Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Code</p>
                    <p className="font-medium text-gray-900 truncate">{item.equipmentCode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Year</p>
                    <p className="font-medium text-gray-900">{item.yearOfManufacture || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Ownership</p>
                    <Badge variant="outline" className={`text-xs ${getOwnershipColor(item.ownership)} w-fit`}>
                      {item.ownership}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Size</p>
                    <p className="font-medium text-gray-900 truncate">
                      {item.size ? `${item.size} ${item.unit || ""}`.trim() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  function EquipmentView({ equipment: equipmentList }: { equipment: Equipment[] }) {
    return viewMode === "table" ? (
      <EquipmentTable equipment={equipmentList} />
    ) : (
      <EquipmentGrid equipment={equipmentList} />
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        {/* Mobile-optimized header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Equipment</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Manage construction equipment</p>
              </div>
            </div>
          </div>
        </header>

        {/* Loading State */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
            <p className="text-gray-600 font-medium">Loading equipment...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        {/* Mobile-optimized header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Equipment</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Manage construction equipment</p>
              </div>
            </div>
          </div>
        </header>

        {/* Error State */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Truck className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Equipment</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Mobile-optimized header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Equipment</h1>
              <p className="text-xs text-gray-500 hidden sm:block">{equipment?.length || 0} total items</p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-gray-300 bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem onClick={handleExportCSV} className="hover:bg-gray-50">
                  <Download className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel} className="hover:bg-gray-50">
                  <Download className="mr-2 h-4 w-4" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <BulkUploadDialog onSuccess={() => window.location.reload()} />
            <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/equipment/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Equipment
              </Link>
            </Button>
          </div>

          {/* Mobile Actions */}
          <div className="flex sm:hidden items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem onClick={handleExportCSV} className="hover:bg-gray-50">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel} className="hover:bg-gray-50">
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </DropdownMenuItem>
                <div className="px-2 py-1">
                  <BulkUploadDialog onSuccess={() => window.location.reload()} />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/equipment/new">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search and Filters */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search equipment by name, code, type, or model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="excavator">Excavator</SelectItem>
                      <SelectItem value="bulldozer">Bulldozer</SelectItem>
                      <SelectItem value="dumptruck">Dump Truck</SelectItem>
                      <SelectItem value="crane">Crane</SelectItem>
                      <SelectItem value="loader">Loader</SelectItem>
                      <SelectItem value="grader">Grader</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="out_of_service">Out of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Toggle - Only visible on larger screens */}
                <div className="hidden md:flex justify-end">
                  <div className="inline-flex rounded-md shadow-sm">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={`rounded-l-md rounded-r-none ${viewMode === "grid" ? "bg-blue-600" : "bg-white border-gray-300"}`}
                    >
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className={`rounded-r-md rounded-l-none ${viewMode === "table" ? "bg-blue-600" : "bg-white border-gray-300"}`}
                    >
                      Table
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Tabs */}
          <Tabs defaultValue="all" className="w-full">
            {/* Mobile-optimized tab list */}
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 min-w-max sm:min-w-0">
                <TabsTrigger
                  value="all"
                  className="text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-blue-600"
                >
                  All ({filteredEquipment.length})
                </TabsTrigger>
                <TabsTrigger
                  value="operational"
                  className="text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-green-600"
                >
                  Operational ({operationalEquipment.length})
                </TabsTrigger>
                <TabsTrigger
                  value="maintenance"
                  className="text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-yellow-600"
                >
                  <span className="hidden sm:inline">Under </span>Maintenance ({maintenanceEquipment.length})
                </TabsTrigger>
                <TabsTrigger
                  value="outofservice"
                  className="text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-red-600"
                >
                  Out of Service ({outOfServiceEquipment.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <TabsContent value="all" className="mt-6">
              <EquipmentView equipment={filteredEquipment} />
            </TabsContent>
            <TabsContent value="operational" className="mt-6">
              <EquipmentView equipment={operationalEquipment} />
            </TabsContent>
            <TabsContent value="maintenance" className="mt-6">
              <EquipmentView equipment={maintenanceEquipment} />
            </TabsContent>
            <TabsContent value="outofservice" className="mt-6">
              <EquipmentView equipment={outOfServiceEquipment} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
