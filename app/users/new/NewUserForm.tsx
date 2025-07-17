"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUser } from "@/app/actions/user-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"


interface Role {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
}

interface Equipment {
  id: number;
  name: string;
}

export default function NewUserForm({ roles, projects = [], equipment = [] }: { roles: Role[]; projects?: Project[]; equipment?: Equipment[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    roleId: string;
    projectIds: string[];
    equipmentIds: string[];
  }>({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    roleId: "",
    projectIds: [],
    equipmentIds: [],
  })

  // Unified change handler for all input/select fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    if (type === "checkbox" && name === "projectIds") {
      const checked = (target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        projectIds: checked
          ? [...formData.projectIds, value]
          : formData.projectIds.filter((id) => id !== value),
      });
    } else if (type === "checkbox" && name === "equipmentIds") {
      const checked = (target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        equipmentIds: checked
          ? [...formData.equipmentIds, value]
          : formData.equipmentIds.filter((id) => id !== value),
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  } 

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, roleId: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Convert formData object to FormData instance for server action compatibility
      const fd = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => fd.append(key, v))
        } else {
          fd.append(key, value ?? "")
        }
      })
      // createUser is a server action that may redirect, so result is never
      // We need to catch redirects and errors via query params
      const result = await createUser(fd)
      if (result?.success) {
        router.replace("/users")
      } else {
        setError(result?.error || "Something went wrong")
      }
    } catch (err) {
      setError("Failed to create user. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 w-full flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>Add a new user to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" value={formData.username} onChange={handleChange} required className="w-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required minLength={6} className="w-full" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleId">Role</Label>
              <Select name="roleId" onValueChange={handleRoleChange} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectIds">Assign Projects</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {projects.map((project: any) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`project-${project.id}`}
                      name="projectIds"
                      value={project.id.toString()}
                      checked={formData.projectIds.includes(project.id.toString())}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    <Label htmlFor={`project-${project.id}`}>{project.name}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentIds">Assign Equipment</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {equipment.map((eq: any) => (
                  <div key={eq.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`equipment-${eq.id}`}
                      name="equipmentIds"
                      value={eq.id.toString()}
                      checked={formData.equipmentIds.includes(eq.id.toString())}
                      onChange={handleChange}
                      className="accent-primary"
                    />
                    <Label htmlFor={`equipment-${eq.id}`}>{eq.name}</Label>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? "Creating..." : "Create User"}
              </Button>
              <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/users">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
