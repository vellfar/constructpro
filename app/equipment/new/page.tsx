"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, Save, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { createEquipment } from "@/app/actions/equipment-actions"
import { toast } from "@/hooks/use-toast"

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function NewEquipmentPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
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

    startTransition(async () => {
      setError("")
      setSuccess("")

      try {
        const formDataObj = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
          if (value.trim()) {
            formDataObj.append(key, value.trim())
          }
        })

        console.log("🚀 Creating equipment with data:", Object.fromEntries(formDataObj.entries()))

        const result = await createEquipment(formDataObj)

        console.log("📝 Create result:", result)

        if (result.success) {
          console.log("✅ Equipment created successfully!")

          setSuccess(result.message || "Equipment created successfully!")

          toast({
            title: "Success!",
            description: result.message || "Equipment created successfully",
            duration: 3000,
          })

          // Redirect after a short delay to show success message
          setTimeout(() => {
            router.push("/equipment")
            router.refresh()
          }, 1500)
        } else {
          console.log("❌ Create failed:", result.error)
          const errorMessage = result.error || "Failed to create equipment"
          setError(errorMessage)

          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          })
        }
      } catch (error) {
        console.error("💥 Unexpected error during creation:", error)

        // Check if this is a redirect error (which means success in Next.js server actions)
        if (
          error instanceof Error &&
          (error.message.includes("NEXT_REDIRECT") ||
            error.message.includes("redirect") ||
            error.digest?.includes("NEXT_REDIRECT"))
        ) {
          console.log("✅ Redirect detected - equipment was created successfully!")

          setSuccess("Equipment created successfully! Redirecting...")

          toast({
            title: "Success!",
            description: "Equipment created successfully",
            duration: 3000,
          })

          // The redirect will handle navigation automatically
          return
        } else {
          const errorMessage = "An unexpected error occurred. Please try again."
          setError(errorMessage)

          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          })
        }
      }
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (error) setError("")
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/equipment" className="mr-2">
          <Button variant="ghost" size="icon" disabled={isPending}>
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
              {/* Success Message */}
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {success}
                    <p className="mt-1 text-xs">Redirecting to equipment list...</p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="equipmentCode">Equipment Plate Number *</Label>
                  <Input
                    id="equipmentCode"
                    placeholder="EXC-001"
                    value={formData.equipmentCode}
                    onChange={(e) => handleInputChange("equipmentCode", e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Equipment Name *</Label>
                  <Input
                    id="name"
                    placeholder="Excavator XC-201"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={
                      formData.type &&
                      ["Excavator", "Bulldozer", "Dump Truck", "Crane", "Loader", "Grader", "Compactor"].includes(
                        formData.type,
                      )
                        ? formData.type
                        : "__CUSTOM__"
                    }
                    onValueChange={(value) => {
                      if (value === "__CUSTOM__") return
                      handleInputChange("type", value === "__NONE__" ? "" : value)
                    }}
                    disabled={isPending}
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
                      <SelectItem value="__CUSTOM__">Other (enter below)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="mt-2"
                    id="typeCustom"
                    placeholder="Or enter custom type"
                    value={
                      formData.type &&
                      !["Excavator", "Bulldozer", "Dump Truck", "Crane", "Loader", "Grader", "Compactor"].includes(
                        formData.type,
                      )
                        ? formData.type
                        : ""
                    }
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    placeholder="Caterpillar"
                    value={formData.make}
                    onChange={(e) => handleInputChange("make", e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder="CAT 320"
                    value={formData.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    required
                    disabled={isPending}
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
                    onChange={(e) => handleInputChange("yearOfManufacture", e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownership">Ownership *</Label>
                  <Select
                    value={formData.ownership || "__NONE__"}
                    onValueChange={(value) => handleInputChange("ownership", value === "__NONE__" ? "" : value)}
                    disabled={isPending}
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
                  <Label htmlFor="measurementType">Measurement Type *</Label>
                  <Input
                    id="measurementType"
                    placeholder="Volume"
                    value={formData.measurementType}
                    onChange={(e) => handleInputChange("measurementType", e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    placeholder="m³"
                    value={formData.unit}
                    onChange={(e) => handleInputChange("unit", e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2.5"
                    value={formData.size}
                    onChange={(e) => handleInputChange("size", e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workMeasure">Fuel Consumption Rate *</Label>
                <Input
                  id="workMeasure"
                  placeholder="12L/hr"
                  value={formData.workMeasure}
                  onChange={(e) => handleInputChange("workMeasure", e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="acquisitionCost">Acquisition Cost (UGX)</Label>
                  <Input
                    id="acquisitionCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="150000"
                    value={formData.acquisitionCost}
                    onChange={(e) => handleInputChange("acquisitionCost", e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    placeholder="Heavy Equipment Co."
                    value={formData.supplier}
                    onChange={(e) => handleInputChange("supplier", e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateReceived">Date Received</Label>
                <Input
                  id="dateReceived"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={formData.dateReceived}
                  onChange={(e) => handleInputChange("dateReceived", e.target.value)}
                  disabled={isPending}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button type="button" variant="outline" asChild disabled={isPending}>
                <Link href="/equipment">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isPending} className="min-w-[140px]">
                {isPending ? (
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
