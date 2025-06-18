"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, UserCheck, UserX } from "lucide-react"
import Link from "next/link"
import { deleteUser, toggleUserStatus } from "@/app/actions/user-actions"
import { useRouter } from "next/navigation"

interface UserActionsProps {
  user: {
    id: number
    firstName: string
    lastName: string
    isActive: boolean
  }
  currentUserRole: string
}

export function UserActions({ user, currentUserRole }: UserActionsProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === "Admin"

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      try {
        await deleteUser(user.id)
        router.refresh()
      } catch (error) {
        alert("Failed to delete user")
      }
    }
  }

  const handleToggleStatus = async () => {
    try {
      await toggleUserStatus(user.id)
      router.refresh()
    } catch (error) {
      alert("Failed to update user status")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/users/${user.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/users/${user.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleStatus}>
              {user.isActive ? (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
