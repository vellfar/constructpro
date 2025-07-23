"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { updateUser } from "@/app/actions/user-actions"

export default function EditUserForm({
  user,
  roles,
  projects,
  equipment,
  projectAssignments,
  equipmentAssignments,
}: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber || "",
    roleId: user.roleId.toString(),
    isActive: user.isActive,
    projectIds: projectAssignments?.map((pa: any) => pa.projectId.toString()) || [],
    equipmentIds: equipmentAssignments?.map((ea: any) => ea.equipmentId.toString()) || [],
  })

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    if (type === "checkbox" && name === "isActive") {
      setFormData({ ...formData, isActive: checked })
    } else if (type === "checkbox" && name === "projectIds") {
      setFormData({
        ...formData,
        projectIds: checked
          ? [...formData.projectIds, value]
          : formData.projectIds.filter((id: string) => id !== value),
      })
    } else if (type === "checkbox" && name === "equipmentIds") {
      setFormData({
        ...formData,
        equipmentIds: checked
          ? [...formData.equipmentIds, value]
          : formData.equipmentIds.filter((id: string) => id !== value),
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, roleId: value })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => fd.append(key, v))
        } else {
          fd.append(key, value)
        }
      })
      await updateUser(user.id, fd)
      router.replace(`/users/${user.id}`)
    } catch (err: any) {
      setError(err?.message || "Failed to update user.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="roleId">Role</Label>
        <Select value={formData.roleId} onValueChange={handleRoleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role: any) => (
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
      <div className="flex items-center space-x-2">
        <Checkbox id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} />
        <Label htmlFor="isActive">{formData.isActive ? "Active User" : "Inactive User"}</Label>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update User"}
        </Button>
        <Button type="button" variant="outline" asChild disabled={loading}>
          <Link href={`/users/${user.id}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
