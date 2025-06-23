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
  name?: string
  disabled?: boolean
  className?: string
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
  name,
  disabled = false,
  className,
}: SafeSelectProps) {
  // Ensure we never have empty string values
  const safeValue = value === "" ? "__EMPTY__" : value
  const safeDefaultValue = defaultValue === "" ? "__EMPTY__" : defaultValue

  const handleValueChange = (newValue: string) => {
    const finalValue = newValue === "__EMPTY__" ? "" : newValue
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
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && <SelectItem value="__EMPTY__">{emptyLabel}</SelectItem>}
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
