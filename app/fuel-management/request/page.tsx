"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { createFuelRequest } from "@/app/actions/fuel-actions"
import { toast } from "@/hooks/use-toast"

interface Equipment {
  id: number
  name: string
  equipmentCode: string
}

interface Project {
  id: number
  name: string
  projectCode: string
}

export default function FuelRequestForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [formData, setFormData] = useState({
    equipmentId: "",
    projectId: "",
    fuelType: "",
    quantity: "",
    justification: "",
  })

  useEffect(() => {
    // Fetch equipment and projects
    const fetchData = async () => {
      try {
        const [equipmentRes, projectsRes] = await Promise.all([fetch("/api/equipment"), fetch("/api/projects")])

        if (equipmentRes.ok) {
          const equipmentData = await equipmentRes.json()
          setEquipment(equipmentData.filter((eq: any) => eq.status === "OPERATIONAL"))
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjects(projectsData.filter((proj: any) => proj.status === "ACTIVE"))
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append("equipmentId", formData.equipmentId)
      formDataObj.append("projectId", formData.projectId)
      formDataObj.append("fuelType", formData.fuelType)
      formDataObj.append("quantity", formData.quantity)
      formDataObj.append("justification", formData.justification)

      const result = await createFuelRequest(formDataObj)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Fuel request created successfully",
        })
        router.push("/fuel-management")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create fuel request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/fuel-management" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">New Fuel Request</div>
      </header>

      <div className="mx-auto w-full max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Fuel Request Details</CardTitle>
            <CardDescription>Fill in the details below to submit a new fuel request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="equipmentId">Equipment *</Label>
                  <Select
                    value={formData.equipmentId}
                    onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id.toString()}>
                          {eq.name} ({eq.equipmentCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name} ({project.projectCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type *</Label>
                  <Select
                    value={formData.fuelType}
                    onValueChange={(value) => setFormData({ ...formData, fuelType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="PETROL">Petrol</SelectItem>
                      <SelectItem value="KEROSENE">Kerosene</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity (Liters) *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    required
                    placeholder="100"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Justification *</Label>
                <Textarea
                  id="justification"
                  placeholder="Explain why this fuel is needed"
                  rows={4}
                  required
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Submitting..." : "Submit Request"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/fuel-management">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
