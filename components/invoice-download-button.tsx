"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function InvoiceDownloadButton({ invoiceId }: { invoiceId: number }) {
  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/invoices/download?id=${invoiceId}`)
      if (!res.ok) throw new Error("Download failed")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download PDF:", error)
      alert("Failed to download PDF.")
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <Download className="mr-2 h-4 w-4" />
      Download PDF
    </Button>
  )
}
