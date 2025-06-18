"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { approveFuelRequest } from "@/app/actions/fuel-actions"
import { useRouter } from "next/navigation"

interface FuelApprovalButtonProps {
  requestId: number
}

export function FuelApprovalButton({ requestId }: FuelApprovalButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [comments, setComments] = useState("")
  const router = useRouter()

  const handleApproval = async (approved: boolean) => {
    setIsLoading(true)
    try {
      const result = await approveFuelRequest(requestId, approved, comments)
      if (result.success) {
        setIsOpen(false)
        setComments("")
        router.refresh()
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error("Error processing approval:", error)
      alert("Failed to process approval")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Review Fuel Request</DialogTitle>
          <DialogDescription>Approve or reject this fuel request with optional comments.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Add any comments about this decision..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => handleApproval(false)} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
            Reject
          </Button>
          <Button onClick={() => handleApproval(true)} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
