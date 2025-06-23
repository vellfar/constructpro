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
import { toast } from "@/hooks/use-toast"
import type { FuelType, FuelUrgency } from "@prisma/client"

interface Equipment {
  id: number
  name: string
  equipmentCode: string
  status?: string
}

interface Project {
  id: number
  name: string
  projectCode?: string
  status?: string
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
    requestedQuantity: "",
    justification: "",
    urgency: "NORMAL" as FuelUrgency,
  })

  useEffect(() => {
    // Fetch equipment and projects
    const fetchData = async () => {
      try {
        const [equipmentRes, projectsRes] = await Promise.all([
          fetch("/api/equipment").catch(() => null),
          fetch("/api/projects").catch(() => null),
        ])

        if (equipmentRes?.ok) {
          try {
            const equipmentData = await equipmentRes.json()
            // Handle both direct array and wrapped response formats
            const equipmentArray = Array.isArray(equipmentData)
              ? equipmentData
              : equipmentData.data
                ? equipmentData.data
                : equipmentData.success && Array.isArray(equipmentData.data)
                  ? equipmentData.data
                  : []

            // Filter for operational equipment
            const operationalEquipment = equipmentArray.filter(
              (eq: Equipment) => !eq.status || eq.status === "OPERATIONAL" || eq.status === "ACTIVE",
            )
            setEquipment(operationalEquipment)
          } catch (parseError) {
            console.warn("Failed to parse equipment data")
            setEquipment([])
          }
        } else {
          setEquipment([])
        }

        if (projectsRes?.ok) {
          try {
            const projectsData = await projectsRes.json()
            // Handle both direct array and wrapped response formats
            const projectsArray = Array.isArray(projectsData)
              ? projectsData
              : projectsData.data
                ? projectsData.data
                : projectsData.success && Array.isArray(projectsData.data)
                  ? projectsData.data
                  : []

            // Filter for active projects
            const activeProjects = projectsArray.filter(
              (proj: Project) => !proj.status || proj.status === "ACTIVE" || proj.status === "PLANNING",
            )
            setProjects(activeProjects)
          } catch (parseError) {
            console.warn("Failed to parse projects data")
            setProjects([])
          }
        } else {
          setProjects([])
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate form data
      if (
        !formData.equipmentId ||
        !formData.projectId ||
        !formData.fuelType ||
        !formData.requestedQuantity ||
        !formData.justification
      ) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Create the request object with proper types
      const requestData = {
        equipmentId: Number.parseInt(formData.equipmentId),
        projectId: Number.parseInt(formData.projectId),
        fuelType: formData.fuelType as FuelType,
        requestedQuantity: Number.parseFloat(formData.requestedQuantity),
        justification: formData.justification,
        urgency: formData.urgency,
      }

      const response = await fetch("/api/fuel-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (response.ok && (result.success || result.id)) {
        toast({
          title: "Success",
          description: result.message || "Fuel request created successfully",
        })
        router.push("/fuel-management")
      } else {
        toast({
          title: "Error",
          description: result.error || result.message || "Failed to create fuel request",
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
                    value={formData.equipmentId || "__NONE__"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, equipmentId: value === "__NONE__" ? "" : value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__" disabled>
                        Select equipment
                      </SelectItem>
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
                    value={formData.projectId || "__NONE__"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, projectId: value === "__NONE__" ? "" : value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__" disabled>
                        Select project
                      </SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name} {project.projectCode && `(${project.projectCode})`}
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
                    value={formData.fuelType || "__NONE__"}
                    onValueChange={(value) => setFormData({ ...formData, fuelType: value === "__NONE__" ? "" : value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__" disabled>
                        Select fuel type
                      </SelectItem>
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="PETROL">Petrol</SelectItem>
                      <SelectItem value="KEROSENE">Kerosene</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestedQuantity">Quantity (Liters) *</Label>
                  <Input
                    id="requestedQuantity"
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="100"
                    value={formData.requestedQuantity}
                    onChange={(e) => setFormData({ ...formData, requestedQuantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency *</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) => setFormData({ ...formData, urgency: value as FuelUrgency })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Justification *</Label>
                <Textarea
                  id="justification"
                  placeholder="Explain why this fuel is needed and how it will be used"
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
