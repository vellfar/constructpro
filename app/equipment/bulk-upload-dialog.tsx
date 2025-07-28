"use client"
import { useState } from "react"
import EquipmentBulkUpload from "@/components/equipment-bulk-upload"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

export default function BulkUploadDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-300 bg-transparent flex items-center gap-2 sm:gap-2 sm:inline-flex w-full sm:w-auto justify-start sm:justify-center"
        >
          <Upload className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Bulk Upload</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Bulk Equipment Upload</DialogTitle>
        </DialogHeader>
        <EquipmentBulkUpload onSuccess={() => { setOpen(false); onSuccess?.() }} />
      </DialogContent>
    </Dialog>
  )
}
