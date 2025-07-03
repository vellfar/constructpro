"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Plus, Search, Truck, Loader2, Download } from "lucide-react"
import Link from "next/link"
import { getEquipment } from "@/app/actions/equipment-actions"
import { EquipmentActions } from "@/components/equipment-actions"
import { exportToCSV, exportToExcel, formatDataForExport } from "@/lib/export-utils"
export const viewport = {
  width: 'device-width',
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

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const result = await getEquipment()
        if (result.success && result.data) {
          setEquipment(result.data)
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

  const operationalEquipment = equipment?.filter((e) => e.status === "OPERATIONAL") || []
  const maintenanceEquipment = equipment?.filter((e) => e.status === "UNDER_MAINTENANCE") || []
  const outOfServiceEquipment = equipment?.filter((e) => e.status === "OUT_OF_SERVICE") || []

  function EquipmentGrid({ equipment: equipmentList }: { equipment: Equipment[] }) {
    if (!equipmentList || equipmentList.length === 0) {
      return (
        <div className="empty-state">
          <Truck className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No equipment found</h3>
          <p className="text-sm text-muted-foreground">Get started by adding your first piece of equipment.</p>
          <Button asChild className="mt-4">
            <Link href="/equipment/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {equipmentList.map((item) => (
          <Card
            key={item.id}
            className="card-enhanced overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in"
          >
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Truck className="h-10 w-10 text-primary/40" />
              </div>
              <Badge
                className="absolute right-2 top-2"
                variant={
                  item.status === "OPERATIONAL"
                    ? "default"
                    : item.status === "UNDER_MAINTENANCE"
                      ? "secondary"
                      : "destructive"
                }
              >
                {item.status.replace("_", " ")}
              </Badge>
              <div className="absolute left-2 top-2">
                <EquipmentActions equipment={item} />
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                    <h3 className="font-semibold truncate text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.type} • {item.make} {item.model}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Code</p>
                    <p className="font-medium">{item.equipmentCode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Year</p>
                    <p className="font-medium">{item.yearOfManufacture || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ownership</p>
                    <p className="font-medium">{item.ownership}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Size</p>
                    <p className="font-medium">
                      {item.size || "N/A"} {item.unit || ""}
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

  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="dashboard-header">
          <div className="flex items-center gap-2 font-semibold">
            <Truck className="h-5 w-5" />
            Equipment
          </div>
        </header>
        <div className="loading-spinner">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading equipment...</p>
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
            <Truck className="h-5 w-5" />
            Equipment
          </div>
        </header>
        <div className="p-6">
          <div className="error-state">
            <p className="text-destructive font-medium">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="dashboard-header">
        <div className="flex items-center gap-2 font-semibold">
          <Truck className="h-5 w-5" />
          Equipment
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button size="sm" asChild>
            <Link href="/equipment/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Link>
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* 
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search equipment..." className="w-full bg-background pl-8" />
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Equipment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="excavator">Excavator</SelectItem>
                  <SelectItem value="bulldozer">Bulldozer</SelectItem>
                  <SelectItem value="dumptruck">Dump Truck</SelectItem>
                  <SelectItem value="crane">Crane</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="outofservice">Out of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div> */}

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Equipment ({equipment?.length || 0})</TabsTrigger>
              <TabsTrigger value="operational">Operational ({operationalEquipment.length})</TabsTrigger>
              <TabsTrigger value="maintenance">Under Maintenance ({maintenanceEquipment.length})</TabsTrigger>
              <TabsTrigger value="outofservice">Out of Service ({outOfServiceEquipment.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <EquipmentGrid equipment={equipment || []} />
            </TabsContent>
            <TabsContent value="operational" className="mt-6">
              <EquipmentGrid equipment={operationalEquipment} />
            </TabsContent>
            <TabsContent value="maintenance" className="mt-6">
              <EquipmentGrid equipment={maintenanceEquipment} />
            </TabsContent>
            <TabsContent value="outofservice" className="mt-6">
              <EquipmentGrid equipment={outOfServiceEquipment} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
