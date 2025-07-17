"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertCircle, RefreshCw, Hash } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

interface Client {
  id: number
  name: string
  email?: string
}

interface Employee {
  id: number
  firstName: string
  lastName: string
  fullName?: string
  role: string
  department?: string | null
  email?: string | null
  position?: string
  employeeNumber?: string | null
}

interface ProjectFormProps {
  initialData?: any
  onSubmit: (formData: FormData) => Promise<any>
  isLoading?: boolean
  submitButtonText?: string
}

export function ProjectForm({ initialData, onSubmit, isLoading = false, submitButtonText }: ProjectFormProps) {
  const router = useRouter()

  // Data states
  const [clients, setClients] = useState<Client[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  // Loading states
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingProjectCode, setLoadingProjectCode] = useState(false)

  // Error states
  const [clientsError, setClientsError] = useState<string | null>(null)
  const [employeesError, setEmployeesError] = useState<string | null>(null)
  const [projectCodeError, setProjectCodeError] = useState<string | null>(null)

  // Form states
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialData?.clientId ? initialData.clientId.toString() : "NO_CLIENT",
  )
  const [selectedStatus, setSelectedStatus] = useState<string>(initialData?.status || "PLANNING")
  const [projectCode, setProjectCode] = useState<string>(initialData?.projectCode || "")

  useEffect(() => {
    fetchAllData()
    // Only generate project code for new projects (no initialData)
    if (!initialData) {
      generateProjectCode()
    }
  }, [])

  async function fetchAllData() {
    await Promise.all([fetchClients(), fetchEmployees()])
  }

  async function generateProjectCode() {
    try {
      setLoadingProjectCode(true)
      setProjectCodeError(null)

      const response = await fetch("/api/projects?generateCode=true")

      if (!response.ok) {
        throw new Error(`Failed to generate project code: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setProjectCode(data.projectCode)
        console.log("✅ Generated project code:", data.projectCode)
      } else {
        throw new Error(data.error || "Failed to generate project code")
      }
    } catch (error) {
      console.error("❌ Failed to generate project code:", error)
      setProjectCodeError("Failed to generate project code")
      // Fallback to manual entry
      setProjectCode("")
    } finally {
      setLoadingProjectCode(false)
    }
  }

  async function fetchClients() {
    try {
      setLoadingClients(true)
      setClientsError(null)

      const response = await fetch("/api/clients")

      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.status}`)
      }

      const data = await response.json()
      console.log("📋 Clients data:", data)

      // Handle different response formats
      let clientsData: Client[] = []
      if (Array.isArray(data)) {
        clientsData = data
      } else if (data.clients && Array.isArray(data.clients)) {
        clientsData = data.clients
      } else if (data.data && Array.isArray(data.data)) {
        clientsData = data.data
      } else if (data.success && data.data && Array.isArray(data.data)) {
        clientsData = data.data
      }

      setClients(clientsData)
      console.log("✅ Clients loaded:", clientsData.length)
    } catch (error) {
      console.error("❌ Failed to fetch clients:", error)
      setClientsError("Failed to load clients")
      setClients([])
    } finally {
      setLoadingClients(false)
    }
  }

  async function fetchEmployees() {
    try {
      setLoadingEmployees(true)
      setEmployeesError(null)

      const response = await fetch("/api/employees?simple=true")

      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.status}`)
      }

      const data = await response.json()
      console.log("👥 Employees data:", data)

      // Handle different response formats
      let employeesData: Employee[] = []
      if (Array.isArray(data)) {
        employeesData = data
      } else if (data.employees && Array.isArray(data.employees)) {
        employeesData = data.employees
      } else if (data.data && Array.isArray(data.data)) {
        employeesData = data.data
      } else if (data.success && data.data && Array.isArray(data.data)) {
        employeesData = data.data
      }

      setEmployees(employeesData)
      console.log("✅ Employees loaded:", employeesData.length)
    } catch (error) {
      console.error("❌ Failed to fetch employees:", error)
      setEmployeesError("Failed to load employees")
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Clean and format budget before submit
    const budgetRaw = formData.get("budget") as string;
    if (budgetRaw) {
      formData.set("budget", budgetRaw.replace(/,/g, ""));
    }

    // Handle client selection
    if (selectedClientId && selectedClientId !== "NO_CLIENT") {
      formData.set("clientId", selectedClientId);
    } else {
      formData.delete("clientId");
    }

    // Handle status
    formData.set("status", selectedStatus);
    // Ensure project code is included
    formData.set("projectCode", projectCode);

    setIsSubmitting(true);
    try {
      const result = await onSubmit(formData);
      if (result?.success) {
        toast({
          title: "Success!",
          description: result.message || "Operation completed successfully",
          duration: 3000,
        });
        router.push("/projects");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result?.error || "An error occurred",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderClientSelect() {
    if (loadingClients) {
      return (
        <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading clients...</span>
        </div>
      )
    }

    if (clientsError) {
      return (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {clientsError}
              <Button variant="outline" size="sm" onClick={fetchClients} className="ml-2">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NO_CLIENT">No client assigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    return (
      <Select value={selectedClientId} onValueChange={setSelectedClientId}>
        <SelectTrigger>
          <SelectValue placeholder="Select a client" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NO_CLIENT">No client assigned</SelectItem>
          {clients.length === 0 ? (
            <SelectItem value="NO_CLIENTS_AVAILABLE" disabled>
              No clients available
            </SelectItem>
          ) : (
            clients.map((client) => (
              <SelectItem key={client.id} value={client.id.toString()}>
                {client.name}
                {client.email && <span className="text-xs text-muted-foreground ml-2">({client.email})</span>}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    )
  }

  function renderProjectCodeField() {
    if (loadingProjectCode) {
      return (
        <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Generating code...</span>
        </div>
      )
    }

    if (projectCodeError) {
      return (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {projectCodeError}
              <Button variant="outline" size="sm" onClick={generateProjectCode} className="ml-2">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
          <Input
            id="projectCode"
            name="projectCode"
            placeholder="Enter project code manually"
            value={projectCode}
            onChange={(e) => setProjectCode(e.target.value)}
            disabled={isFormLoading}
          />
        </div>
      )
    }

    return (
      <div className="relative">
        <Input
          id="projectCode"
          name="projectCode"
          placeholder="PRJ-0001"
          value={projectCode}
          onChange={(e) => setProjectCode(e.target.value)}
          disabled={isFormLoading}
          className="pr-10"
        />
        {!initialData && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateProjectCode}
            disabled={loadingProjectCode || isFormLoading}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            title="Generate new project code"
          >
            <Hash className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  const isFormLoading = isLoading || isSubmitting || loadingClients || loadingEmployees

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="Enter project name"
            defaultValue={initialData?.name || ""}
            required
            disabled={isFormLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectCode">
            Project Code *{!initialData && <span className="text-xs text-muted-foreground ml-1">(Auto-generated)</span>}
          </Label>
          {renderProjectCodeField()}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Project description and details"
          rows={3}
          defaultValue={initialData?.description || ""}
          disabled={isFormLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client</Label>
          {renderClientSelect()}
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isFormLoading}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            placeholder="Project location"
            defaultValue={initialData?.location || ""}
            disabled={isFormLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Project Budget / contract price (UGX) *</Label>
          <div className="relative">
            <Input
              id="budget"
              name="budget"
              type="text"
              inputMode="numeric"
              pattern="[0-9,]*"
              placeholder="0.00"
              defaultValue={initialData?.budget ? initialData.budget.toLocaleString("en-US") : ""}
              required
              disabled={isFormLoading}
              onChange={e => {
                // Format with commas as user types
                const raw = e.target.value.replace(/,/g, "");
                if (!isNaN(Number(raw))) {
                  e.target.value = Number(raw).toLocaleString("en-US");
                }
              }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">UGX</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={initialData?.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : ""}
            disabled={isFormLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="plannedEndDate">Planned End Date</Label>
          <Input
            id="plannedEndDate"
            name="plannedEndDate"
            type="date"
            defaultValue={initialData?.plannedEndDate ? new Date(initialData.plannedEndDate).toISOString().split("T")[0] : ""}
            disabled={isFormLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="actualEndDate">Actual End Date</Label>
          <Input
            id="actualEndDate"
            name="actualEndDate"
            type="date"
            defaultValue={initialData?.actualEndDate ? new Date(initialData.actualEndDate).toISOString().split("T")[0] : ""}
            disabled={isFormLoading}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isFormLoading || !projectCode} className="w-full md:w-auto min-w-[200px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? "Updating Project..." : "Creating Project..."}
            </>
          ) : (
            <>{submitButtonText || (initialData ? "Update Project" : "Create Project")}</>
          )}
        </Button>
      </div>
    </form>
  )
}
