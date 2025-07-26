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
        <Button variant="outline" size="sm" className="border-gray-300 bg-transparent">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Bulk Equipment Upload</DialogTitle>
        </DialogHeader>
        <EquipmentBulkUpload onSuccess={() => { setOpen(false); onSuccess?.() }} />
      </DialogContent>
    </Dialog>
  )
}
