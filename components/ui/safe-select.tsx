"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface SafeSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SafeSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  placeholder?: string
  options: SafeSelectOption[]
  loading?: boolean
  loadingText?: string
  emptyText?: string
  allowEmpty?: boolean
  emptyLabel?: string
  emptyValue?: string
  name?: string
  disabled?: boolean
  className?: string
  required?: boolean
}

export function SafeSelect({
  value,
  onValueChange,
  defaultValue,
  placeholder = "Select an option",
  options,
  loading = false,
  loadingText = "Loading...",
  emptyText = "No options available",
  allowEmpty = true,
  emptyLabel = "None selected",
  emptyValue = "__EMPTY__",
  name,
  disabled = false,
  className,
  required = false,
}: SafeSelectProps) {
  // Ensure we never have empty string values - convert to safe placeholder
  const safeValue = value === "" || value === null || value === undefined ? emptyValue : value
  const safeDefaultValue =
    defaultValue === "" || defaultValue === null || defaultValue === undefined ? emptyValue : defaultValue

  const handleValueChange = (newValue: string) => {
    // Convert placeholder values back to empty strings
    const finalValue = newValue === emptyValue ? "" : newValue
    onValueChange?.(finalValue)
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-2 border rounded">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">{loadingText}</span>
      </div>
    )
  }

  return (
    <Select
      value={safeValue}
      onValueChange={handleValueChange}
      defaultValue={safeDefaultValue}
      name={name}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && (
          <SelectItem value={emptyValue} disabled={required}>
            {emptyLabel}
          </SelectItem>
        )}
        {options.length === 0 ? (
          <SelectItem value="__NO_OPTIONS__" disabled>
            {emptyText}
          </SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
