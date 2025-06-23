"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectWrapperProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: SelectOption[]
  className?: string
  disabled?: boolean
  allowClear?: boolean
  clearLabel?: string
}

export function SelectWrapper({
  value,
  onValueChange,
  placeholder = "Select an option",
  options,
  className,
  disabled = false,
  allowClear = false,
  clearLabel = "Clear selection",
}: SelectWrapperProps) {
  // Ensure value is never an empty string - use undefined instead
  const safeValue = value === "" ? undefined : value

  const handleValueChange = (newValue: string) => {
    // Handle clear selection
    if (newValue === "__CLEAR__") {
      onValueChange("")
      return
    }
    onValueChange(newValue)
  }

  return (
    <Select value={safeValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowClear && safeValue && (
          <SelectItem value="__CLEAR__" className="text-muted-foreground italic">
            {clearLabel}
          </SelectItem>
        )}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
