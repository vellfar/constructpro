"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { updateEquipment } from "@/app/actions/equipment-actions"

export default function EquipmentEditForm({ equipment }: { equipment: any }) {
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpdate(formData: FormData) {
    setErrorMsg("")
    setLoading(true)
    const result = await updateEquipment(equipment.id, formData)
    setLoading(false)
    if (result?.success) {
      router.push(`/equipment/${equipment.id}`)
    } else {
      setErrorMsg(result?.error || "Failed to update equipment. Please try again.")
    }
  }

  return (
    <CardContent>
      {errorMsg && (
        <div className="mb-4 text-red-600 font-semibold">{errorMsg}</div>
      )}
      <form action={handleUpdate} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="equipmentCode">Equipment Code *</Label>
            <Input
              id="equipmentCode"
              name="equipmentCode"
              defaultValue={equipment.equipmentCode}
              required
              placeholder="EQ-001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Equipment Name *</Label>
            <Input id="name" name="name" defaultValue={equipment.name} required placeholder="Excavator CAT 320" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Input id="type" name="type" defaultValue={equipment.type} required placeholder="Excavator" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input id="make" name="make" defaultValue={equipment.make} required placeholder="Caterpillar" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input id="model" name="model" defaultValue={equipment.model} required placeholder="320D" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="yearOfManufacture">Year of Manufacture</Label>
            <Input
              id="yearOfManufacture"
              name="yearOfManufacture"
              type="number"
              defaultValue={equipment.yearOfManufacture || ""}
              placeholder="2020"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownership">Ownership *</Label>
            <Select name="ownership" defaultValue={equipment.ownership} required>
              <SelectTrigger>
                <SelectValue placeholder="Select ownership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNED">Owned</SelectItem>
                <SelectItem value="RENTED">Rented</SelectItem>
                <SelectItem value="LEASED">Leased</SelectItem>
                <SelectItem value="UNRA">UNRA</SelectItem>
                <SelectItem value="MoWT">MoWT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={equipment.status}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPERATIONAL">Operational</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="measurementType">Measurement Type *</Label>
            <Input
              id="measurementType"
              name="measurementType"
              defaultValue={equipment.measurementType}
              required
              placeholder="Volume"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit *</Label>
            <Input id="unit" name="unit" defaultValue={equipment.unit} required placeholder="m³" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Input
              id="size"
              name="size"
              type="number"
              step="0.01"
              defaultValue={equipment.size || ""}
              placeholder="1.5"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="workMeasure">Work Measure *</Label>
            <Input
              id="workMeasure"
              name="workMeasure"
              defaultValue={equipment.workMeasure}
              required
              placeholder="m³/hour"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acquisitionCost">Acquisition Cost</Label>
            <Input
              id="acquisitionCost"
              name="acquisitionCost"
              type="number"
              step="0.01"
              defaultValue={equipment.acquisitionCost || ""}
              placeholder="250000"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              name="supplier"
              defaultValue={equipment.supplier || ""}
              placeholder="Equipment Supplier Ltd"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateReceived">Date Received</Label>
            <Input
              id="dateReceived"
              name="dateReceived"
              type="date"
              defaultValue={equipment.dateReceived ? new Date(equipment.dateReceived).toISOString().split("T")[0] : ""}
            />
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Equipment"}
          </Button>
          <Button type="button" variant="outline" asChild disabled={loading}>
            <Link href={`/equipment/${equipment.id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </CardContent>
  )
}
