"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, Save, AlertCircle, Calendar } from "lucide-react"
import Link from "next/link"
import { updateProject } from "@/app/actions/project-actions"
import { toast } from "@/hooks/use-toast"

interface Project {
  id: number
  name: string
  description?: string | null
  location?: string | null
  budget: number
  status: string
  projectCode: string
  clientId?: number | null
  plannedEndDate?: Date | null
  actualEndDate?: Date | null
  startDate: Date
  client?: { id: number; name: string } | null
}

interface Client {
  id: number
  name: string
}

interface EditProjectFormProps {
  project: Project
  clients: Client[]
}

export function EditProjectForm({ project, clients }: EditProjectFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state for controlled inputs
  const [selectedClientId, setSelectedClientId] = useState<string>(
    project.clientId ? project.clientId.toString() : "__NONE__",
  )
  const [selectedStatus, setSelectedStatus] = useState<string>(project.status || "PLANNING")
  const [startDate, setStartDate] = useState<string>(
    project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
  )
  const [plannedEndDate, setPlannedEndDate] = useState<string>(
    project.plannedEndDate ? new Date(project.plannedEndDate).toISOString().split("T")[0] : "",
  )
  const [actualEndDate, setActualEndDate] = useState<string>(
    project.actualEndDate ? new Date(project.actualEndDate).toISOString().split("T")[0] : "",
  )

  // Date validation function
  function validateDates(start: string, plannedEnd: string, actualEnd: string): string | null {
    if (!start) return null

    const startDateObj = new Date(start)

    if (plannedEnd) {
      const plannedEndDateObj = new Date(plannedEnd)
      if (plannedEndDateObj <= startDateObj) {
        return "Planned end date must be after start date"
      }
    }

    if (actualEnd) {
      const actualEndDateObj = new Date(actualEnd)
      if (actualEndDateObj <= startDateObj) {
        return "Actual end date must be after start date"
      }
    }

    return null
  }

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      setError(null)
      setSuccess(null)

      // Validate dates before submission
      const dateError = validateDates(startDate, plannedEndDate, actualEndDate)
      if (dateError) {
        setError(dateError)
        toast({
          title: "Invalid Dates",
          description: dateError,
          variant: "destructive",
          duration: 5000,
        })
        return
      }

      // Clean and format budget before submit
      const budgetRaw = formData.get("budget") as string
      if (budgetRaw) {
        // Remove commas and convert to number
        const cleanBudget = budgetRaw.replace(/,/g, "")
        formData.set("budget", cleanBudget)
      }

      // Handle client selection
      if (selectedClientId && selectedClientId !== "__NONE__") {
        formData.set("clientId", selectedClientId)
      } else {
        formData.delete("clientId")
      }

      // Handle status
      formData.set("status", selectedStatus)

      // Add dates to form data
      formData.set("startDate", startDate)
      if (plannedEndDate) formData.set("plannedEndDate", plannedEndDate)
      if (actualEndDate) formData.set("actualEndDate", actualEndDate)

      try {
        console.log("🚀 Updating project with data:", Object.fromEntries(formData.entries()))

        const result = await updateProject(project.id, formData)

        console.log("📝 Update result:", result)

        if (result?.success) {
          console.log("✅ Project updated successfully!")

          setSuccess(result.message || "Project updated successfully!")

          toast({
            title: "Success!",
            description: result.message || "Project updated successfully",
            duration: 3000,
          })

          // Redirect after a short delay to show success message
          setTimeout(() => {
            router.push(`/projects/${project.id}`)
            router.refresh()
          }, 1500)
        } else {
          console.log("❌ Update failed:", result?.error)
          const errorMessage = result?.error || "Failed to update project"
          setError(errorMessage)

          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          })
        }
      } catch (error) {
        console.error("💥 Unexpected error during update:", error)

        // Check if this is a redirect error (which means success in Next.js server actions)
        if (
          error instanceof Error &&
          (error.message.includes("NEXT_REDIRECT") ||
            error.message.includes("redirect") ||
            error.digest?.includes("NEXT_REDIRECT"))
        ) {
          console.log("✅ Redirect detected - project was updated successfully!")

          setSuccess("Project updated successfully! Redirecting...")

          toast({
            title: "Success!",
            description: "Project updated successfully",
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

  const dateValidationError = validateDates(startDate, plannedEndDate, actualEndDate)

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href={`/projects/${project.id}`}>
          <Button variant="ghost" size="sm" disabled={isPending}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">Edit Project</div>
      </header>

      <div className="p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Edit Project</CardTitle>
            <CardDescription>Update project information and settings</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Success Message */}
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                  <p className="mt-1 text-xs">Redirecting to project page...</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form action={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={project.name}
                    required
                    placeholder="Enter project name"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectCode">Project Code *</Label>
                  <Input
                    id="projectCode"
                    name="projectCode"
                    defaultValue={project.projectCode || ""}
                    placeholder="PRJ-001"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={project.description || ""}
                  placeholder="Project description and details"
                  rows={3}
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={isPending}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">No client assigned</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                      {clients.length === 0 && (
                        <SelectItem value="__EMPTY__" disabled>
                          No clients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isPending}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={project.location || ""}
                    placeholder="Project location"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (UGX) *</Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9,]*"
                    defaultValue={project.budget ? project.budget.toLocaleString("en-US") : "0"}
                    required
                    placeholder="0.00"
                    disabled={isPending}
                    onChange={(e) => {
                      // Format with commas as user types, but preserve the raw value
                      const raw = e.target.value.replace(/,/g, "")
                      if (!isNaN(Number(raw)) && raw !== "") {
                        e.target.value = Number(raw).toLocaleString("en-US")
                      }
                    }}
                  />
                </div>
              </div>

              {/* Date validation error display */}
              {dateValidationError && (
                <Alert variant="destructive">
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>{dateValidationError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plannedEndDate">Planned End Date</Label>
                  <Input
                    id="plannedEndDate"
                    name="plannedEndDate"
                    type="date"
                    value={plannedEndDate}
                    onChange={(e) => setPlannedEndDate(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actualEndDate">
                    Actual End Date
                    {selectedStatus === "COMPLETED" && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    id="actualEndDate"
                    name="actualEndDate"
                    type="date"
                    value={actualEndDate}
                    onChange={(e) => setActualEndDate(e.target.value)}
                    disabled={isPending}
                    required={selectedStatus === "COMPLETED"}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button type="submit" disabled={isPending || !!dateValidationError} className="min-w-[140px]">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Project
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" asChild disabled={isPending}>
                  <Link href={`/projects/${project.id}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
