"use client"
import { useRef, useState } from "react"

export default function EquipmentBulkUpload({ onSuccess }: { onSuccess?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<null | { success: boolean; message?: string; errors?: string[] }>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setResult(null)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/equipment/bulk-upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      setResult(data)
      if (data.success) {
        if (fileInputRef.current) fileInputRef.current.value = ""
        if (onSuccess) onSuccess()
      }
    } catch (err) {
      setResult({ success: false, message: "Upload failed. Please try again." })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-white shadow">
      <h2 className="text-lg font-semibold">Bulk Equipment Upload (CSV)</h2>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full border p-2 rounded"
      />
      {uploading && <div className="text-blue-600">Uploading...</div>}
      {result && (
        <div className={result.success ? "text-green-600" : "text-red-600"}>
          {result.message}
          {result.errors && (
            <ul className="mt-2 list-disc list-inside text-sm">
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="text-xs text-gray-500 mt-2">
        <b>CSV columns:</b> equipmentCode, name, type, make, model, yearOfManufacture, ownership, measurementType, unit, size, workMeasure, acquisitionCost, supplier, dateReceived
      </div>
    </div>
  )
}
