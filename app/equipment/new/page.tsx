"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { createEquipment } from "@/app/actions/equipment-actions"
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
export default function NewEquipmentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    equipmentCode: "",
    name: "",
    type: "",
    make: "",
    model: "",
    yearOfManufacture: "",
    ownership: "",
    measurementType: "",
    unit: "",
    size: "",
    workMeasure: "",
    acquisitionCost: "",
    supplier: "",
    dateReceived: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formDataObj = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value)
      })

      const result = await createEquipment(formDataObj)

      if (result.success) {
        router.push("/equipment")
      } else {
        setError(result.error || "Failed to create equipment")
      }
    } catch (err) {
      setError("An error occurred while creating the equipment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/equipment" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">Add New Equipment</div>
      </header>

      <div className="mx-auto w-full max-w-4xl p-6">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Equipment Information</CardTitle>
              <CardDescription>Enter the details for the new equipment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="equipmentCode">Equipment Plate Number*</Label>
                  <Input
                    id="equipmentCode"
                    placeholder="EXC-001"
                    value={formData.equipmentCode}
                    onChange={(e) => setFormData({ ...formData, equipmentCode: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Equipment Name *</Label>
                  <Input
                    id="name"
                    placeholder="Excavator XC-201"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type || "__NONE__"}
                    onValueChange={(value) => setFormData({ ...formData, type: value === "__NONE__" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type or enter custom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__" disabled>
                        Select equipment type
                      </SelectItem>
                      <SelectItem value="Excavator">Excavator</SelectItem>
                      <SelectItem value="Bulldozer">Bulldozer</SelectItem>
                      <SelectItem value="Dump Truck">Dump Truck</SelectItem>
                      <SelectItem value="Crane">Crane</SelectItem>
                      <SelectItem value="Loader">Loader</SelectItem>
                      <SelectItem value="Grader">Grader</SelectItem>
                      <SelectItem value="Compactor">Compactor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="mt-2"
                    id="typeCustom"
                    placeholder="Or enter custom type"
                    value={formData.type && !["Excavator","Bulldozer","Dump Truck","Crane","Loader","Grader","Compactor"].includes(formData.type) ? formData.type : ""}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    placeholder="Caterpillar"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="CAT 320"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="yearOfManufacture">Year of Manufacture</Label>
                  <Input
                    id="yearOfManufacture"
                    type="number"
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.yearOfManufacture}
                    onChange={(e) => setFormData({ ...formData, yearOfManufacture: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownership">Ownership *</Label>
                  <Select
                    value={formData.ownership || "__NONE__"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ownership: value === "__NONE__" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ownership" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__" disabled>
                        Select ownership type
                      </SelectItem>
                      <SelectItem value="OWNED">Owned</SelectItem>
                      <SelectItem value="RENTED">Rented</SelectItem>
                      <SelectItem value="LEASED">Leased</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="measurementType">Measurement Type</Label>
                  <Input
                    id="measurementType"
                    placeholder="Volume"
                    value={formData.measurementType}
                    onChange={(e) => setFormData({ ...formData, measurementType: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    placeholder="m³"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    type="number"
                    step="0.01"
                    placeholder="2.5"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workMeasure">Fuel Consumption Rate</Label>
                <Input
                  id="workMeasure"
                  placeholder="12L/hr"
                  value={formData.workMeasure}
                  onChange={(e) => setFormData({ ...formData, workMeasure: e.target.value })}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="acquisitionCost">Acquisition Cost</Label>
                  <Input
                    id="acquisitionCost"
                    type="number"
                    step="0.01"
                    placeholder="150000"
                    value={formData.acquisitionCost}
                    onChange={(e) => setFormData({ ...formData, acquisitionCost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    placeholder="Heavy Equipment Co."
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateReceived">Date Received</Label>
                <Input
                  id="dateReceived"
                  type="date"
                  value={formData.dateReceived}
                  onChange={(e) => setFormData({ ...formData, dateReceived: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button type="button" variant="outline" asChild>
                <Link href="/equipment">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Equipment
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
