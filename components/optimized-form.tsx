"use client"

import React, { useCallback, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, X } from "lucide-react"

interface FormField {
  name: string
  label: string
  type: "text" | "email" | "password" | "number" | "date" | "textarea" | "select"
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: z.ZodSchema<any>
  className?: string
  description?: string
}

interface OptimizedFormProps {
  title: string
  description?: string
  fields: FormField[]
  schema: z.ZodSchema<any>
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>
  defaultValues?: Record<string, any>
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  loading?: boolean
  className?: string
}

export const OptimizedForm = React.memo<OptimizedFormProps>(
  ({
    title,
    description,
    fields,
    schema,
    onSubmit,
    defaultValues = {},
    submitLabel = "Save",
    cancelLabel = "Cancel",
    onCancel,
    loading = false,
    className = "",
  }) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const {
      control,
      handleSubmit,
      formState: { errors, isDirty, isValid },
      reset,
      watch,
    } = useForm({
      resolver: zodResolver(schema),
      defaultValues,
      mode: "onChange",
    })

    const watchedValues = watch()

    const handleFormSubmit = useCallback(
      async (data: any) => {
        setIsSubmitting(true)
        setSubmitError(null)

        try {
          const result = await onSubmit(data)
          if (!result.success) {
            setSubmitError(result.error || "An error occurred")
          } else {
            reset(data) // Reset form with new values to clear dirty state
          }
        } catch (error) {
          setSubmitError("An unexpected error occurred")
        } finally {
          setIsSubmitting(false)
        }
      },
      [onSubmit, reset],
    )

    const renderField = useCallback(
      (field: FormField) => {
        const error = errors[field.name]
        const hasError = !!error

        const fieldProps = {
          name: field.name,
          placeholder: field.placeholder,
          className: `${field.className || ""} ${hasError ? "border-destructive" : ""}`,
        }

        switch (field.type) {
          case "textarea":
            return (
              <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField }) => <Textarea {...controllerField} {...fieldProps} rows={4} />}
              />
            )

          case "select":
            return (
              <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField }) => (
                  <Select value={controllerField.value || ""} onValueChange={controllerField.onChange}>
                    <SelectTrigger className={fieldProps.className}>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )

          case "number":
            return (
              <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField }) => (
                  <Input
                    {...controllerField}
                    {...fieldProps}
                    type="number"
                    step="any"
                    onChange={(e) => {
                      const value = e.target.value
                      controllerField.onChange(value === "" ? undefined : Number.parseFloat(value))
                    }}
                    value={controllerField.value || ""}
                  />
                )}
              />
            )

          case "date":
            return (
              <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField }) => (
                  <Input
                    {...controllerField}
                    {...fieldProps}
                    type="date"
                    value={controllerField.value ? new Date(controllerField.value).toISOString().split("T")[0] : ""}
                    onChange={(e) => {
                      const value = e.target.value
                      controllerField.onChange(value ? new Date(value) : undefined)
                    }}
                  />
                )}
              />
            )

          default:
            return (
              <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField }) => (
                  <Input {...controllerField} {...fieldProps} type={field.type} value={controllerField.value || ""} />
                )}
              />
            )
        }
      },
      [control, errors],
    )

    const memoizedFields = useMemo(() => {
      return fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {renderField(field)}
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          {errors[field.name] && <p className="text-xs text-destructive">{errors[field.name]?.message as string}</p>}
        </div>
      ))
    }, [fields, renderField, errors])

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">{memoizedFields}</div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  <X className="h-4 w-4 mr-2" />
                  {cancelLabel}
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting || !isDirty || !isValid || loading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {submitLabel}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  },
)

OptimizedForm.displayName = "OptimizedForm"
