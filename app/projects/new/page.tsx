"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { createProject } from "@/app/actions/project-actions"
import { ProjectForm } from "@/components/forms/project-form"

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("🚀 Submitting form...")
      const result = await createProject(formData)

      // If we get here, it means there was an error (redirect would have happened)
      if (result && !result.success) {
        console.log("❌ Error:", result.error)
        setError(result.error || "Failed to create project")
      }
    } catch (error) {
      console.error("💥 Unexpected error:", error)

      // Check if this is a redirect error (which means success)
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
        console.log("✅ Redirect detected - project was created successfully!")
        // The redirect will handle navigation, so we don't need to do anything
        return
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <div className="flex items-center gap-2 font-semibold">New Project</div>
      </header>

      <div className="p-6 max-w-2xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>Add a new construction project to your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="rounded-md bg-destructive/10 p-4 mb-6 border border-destructive/20">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">Error</h3>
                    <div className="mt-2 text-sm text-destructive">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4 mb-6 border border-green-200">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{success}</p>
                      <p className="mt-1 text-xs">Redirecting to projects page...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <ProjectForm onSubmit={handleSubmit} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
