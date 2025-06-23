"use client"

// Utility functions to handle Select component values safely
export const safeSelectValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") {
    return "__EMPTY__"
  }
  return value.toString()
}

export const unsafeSelectValue = (value: string): string => {
  if (value === "__EMPTY__") {
    return ""
  }
  return value
}

export const createSelectOptions = (items: any[], valueKey = "id", labelKey = "name", placeholderLabel?: string) => {
  const options = items.map((item) => ({
    value: item[valueKey].toString(),
    label: item[labelKey],
  }))

  if (placeholderLabel) {
    options.unshift({
      value: "__EMPTY__",
      label: placeholderLabel,
    })
  }

  return options
}
