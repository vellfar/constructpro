"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { deleteEquipment } from "@/app/actions/equipment-actions"

interface EquipmentActionsProps {
  equipment: {
    id: number
    name: string
    equipmentCode: string
  }
}

export function EquipmentActions({ equipment }: EquipmentActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const [deleteError, setDeleteError] = useState<string>("")
  const handleDelete = async () => {
    setIsDeleting(true)
    setDeleteError("")
    try {
      const result = await deleteEquipment(equipment.id)
      if (result.success) {
        router.refresh()
        setShowDeleteDialog(false)
      } else {
        setDeleteError(result.error || "Failed to delete equipment.")
        console.error("Failed to delete equipment:", result.error)
      }
    } catch (error) {
      setDeleteError("An unexpected error occurred.")
      console.error("Error deleting equipment:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Custom navigation handler for Edit Equipment
  const handleEdit = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setMenuOpen(false)
    router.push(`/equipment/${equipment.id}/edit`)
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/equipment/${equipment.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/equipment/${equipment.id}/edit`} onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Equipment
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Equipment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the equipment "{equipment.name}" ({equipment.equipmentCode}). This action
              cannot be undone.
            </AlertDialogDescription>
            {deleteError && (
              <div className="mt-2 text-sm text-red-600 font-semibold">{deleteError}</div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Equipment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
