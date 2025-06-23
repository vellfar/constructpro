"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"

interface FormField {
  name: string
  type: "text" | "number" | "email" | "password" | "select" | "multiselect" | "textarea" | "date" | "checkbox" | "radio"
  label: string
  required?: boolean
  options?: { value: string | number; label: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    custom?: (value: any) => string | null
  }
  dependencies?: string[] // Fields this field depends on
  conditional?: (formData: any) => boolean // Show/hide based on other fields
  placeholder?: string
  helpText?: string
  disabled?: boolean
}

interface FormConfig {
  fields: FormField[]
  submitEndpoint: string
  method?: "POST" | "PUT" | "PATCH"
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  validateOnChange?: boolean
  resetOnSubmit?: boolean
}

interface FormState {
  data: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  loading: boolean
  submitting: boolean
}

export function useDynamicForm(config: FormConfig, initialData?: Record<string, any>) {
  const { data: session } = useSession()
  const [state, setState] = useState<FormState>({
    data: initialData || {},
    errors: {},
    touched: {},
    loading: false,
    submitting: false,
  })

  // Dynamic field options loading
  const [fieldOptions, setFieldOptions] = useState<Record<string, any[]>>({})

  const loadFieldOptions = useCallback(async (field: FormField) => {
    if (field.type === "select" || field.type === "multiselect") {
      if (field.options) {
        setFieldOptions((prev) => ({ ...prev, [field.name]: field.options! }))
      } else {
        // Load options dynamically based on field name
        try {
          let endpoint = ""
          switch (field.name) {
            case "clientId":
              endpoint = "/api/clients"
              break
            case "projectId":
              endpoint = "/api/projects"
              break
            case "equipmentId":
              endpoint = "/api/equipment"
              break
            case "employeeId":
              endpoint = "/api/employees"
              break
            case "userId":
              endpoint = "/api/users"
              break
            case "roleId":
              endpoint = "/api/roles"
              break
            default:
              return
          }

          const response = await fetch(endpoint)
          if (response.ok) {
            const data = await response.json()
            const options = Array.isArray(data) ? data : data.data || []
            setFieldOptions((prev) => ({
              ...prev,
              [field.name]: options.map((item: any) => ({
                value: item.id,
                label: item.name || `${item.firstName} ${item.lastName}` || item.title || item.label,
              })),
            }))
          }
        } catch (error) {
          console.error(`Failed to load options for ${field.name}:`, error)
        }
      }
    }
  }, [])

  // Load all field options on mount
  useEffect(() => {
    config.fields.forEach((field) => {
      if (field.type === "select" || field.type === "multiselect") {
        loadFieldOptions(field)
      }
    })
  }, [config.fields, loadFieldOptions])

  const validateField = useCallback((field: FormField, value: any): string | null => {
    if (field.required && (!value || (typeof value === "string" && !value.trim()))) {
      return `${field.label} is required`
    }

    if (field.validation) {
      const { min, max, pattern, custom } = field.validation

      if (min !== undefined && value < min) {
        return `${field.label} must be at least ${min}`
      }

      if (max !== undefined && value > max) {
        return `${field.label} must be at most ${max}`
      }

      if (pattern && typeof value === "string" && !new RegExp(pattern).test(value)) {
        return `${field.label} format is invalid`
      }

      if (custom) {
        const customError = custom(value)
        if (customError) return customError
      }
    }

    return null
  }, [])

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    config.fields.forEach((field) => {
      if (field.conditional && !field.conditional(state.data)) {
        return // Skip validation for hidden fields
      }

      const error = validateField(field, state.data[field.name])
      if (error) {
        newErrors[field.name] = error
      }
    })

    setState((prev) => ({ ...prev, errors: newErrors }))
    return Object.keys(newErrors).length === 0
  }, [config.fields, state.data, validateField])

  const setValue = useCallback(
    (name: string, value: any) => {
      setState((prev) => {
        const newData = { ...prev.data, [name]: value }
        const newTouched = { ...prev.touched, [name]: true }

        const newErrors = { ...prev.errors }

        if (config.validateOnChange) {
          const field = config.fields.find((f) => f.name === name)
          if (field) {
            const error = validateField(field, value)
            if (error) {
              newErrors[name] = error
            } else {
              delete newErrors[name]
            }
          }
        }

        return {
          ...prev,
          data: newData,
          touched: newTouched,
          errors: newErrors,
        }
      })
    },
    [config.fields, config.validateOnChange, validateField],
  )

  const setValues = useCallback((values: Record<string, any>) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, ...values },
      touched: { ...prev.touched, ...Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}) },
    }))
  }, [])

  const submit = useCallback(async () => {
    if (!validateForm()) {
      return { success: false, errors: state.errors }
    }

    setState((prev) => ({ ...prev, submitting: true }))

    try {
      const formData = new FormData()
      Object.entries(state.data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach((v) => formData.append(key, v))
          } else {
            formData.append(key, value.toString())
          }
        }
      })

      const response = await fetch(config.submitEndpoint, {
        method: config.method || "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        config.onSuccess?.(result)
        if (config.resetOnSubmit) {
          setState((prev) => ({
            ...prev,
            data: initialData || {},
            errors: {},
            touched: {},
          }))
        }
        return { success: true, data: result }
      } else {
        const error = result.error || "Submission failed"
        config.onError?.(error)
        return { success: false, error }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error"
      config.onError?.(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setState((prev) => ({ ...prev, submitting: false }))
    }
  }, [config, state.data, state.errors, validateForm, initialData])

  const reset = useCallback(() => {
    setState({
      data: initialData || {},
      errors: {},
      touched: {},
      loading: false,
      submitting: false,
    })
  }, [initialData])

  // Get visible fields based on conditional logic
  const visibleFields = config.fields.filter((field) => !field.conditional || field.conditional(state.data))

  return {
    ...state,
    fieldOptions,
    visibleFields,
    setValue,
    setValues,
    submit,
    reset,
    validateForm,
    isValid: Object.keys(state.errors).length === 0,
  }
}
