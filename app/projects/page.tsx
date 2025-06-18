"use client"

import { useState, useEffect } from "react"
import { getProjects } from "@/app/actions/project-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, Construction, Filter, Plus, Search, Loader2 } from "lucide-react"
import Link from "next/link"

interface Project {
  id: number
  name: string
  location: string
  status: string
  budget: number
  endDate: Date | null
  client: { name: string } | null
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const result = await getProjects()
        if (result.success && result.data) {
          setProjects(result.data)
        } else {
          setError(result.error || "Failed to load projects")
        }
      } catch (err) {
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default"
      case "COMPLETED":
        return "secondary"
      case "PLANNING":
        return "outline"
      case "ON_HOLD":
        return "destructive"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const filterProjectsByStatus = (status?: string) => {
    if (!projects) return []
    if (!status || status === "all") return projects
    return projects.filter((project) => project.status === status)
  }

  const calculateProgress = (project: any) => {
    switch (project.status) {
      case "PLANNING":
        return 10
      case "ACTIVE":
        return Math.floor(Math.random() * 70) + 20
      case "COMPLETED":
        return 100
      default:
        return 0
    }
  }

  const ProjectCard = ({ project }: { project: any }) => (
    <Link href={`/projects/${project.id}`} className="block animate-fade-in">
      <Card className="card-enhanced overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Construction className="h-10 w-10 text-primary/40" />
          </div>
          <Badge className="absolute right-2 top-2" variant={getStatusBadgeVariant(project.status)}>
            {project.status}
          </Badge>
        </div>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold truncate text-foreground">{project.name}</h3>
              <p className="text-sm text-muted-foreground">{project.location || "No location"}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{calculateProgress(project)}%</span>
              </div>
              <Progress value={calculateProgress(project)} className="h-2" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="mr-1 h-3 w-3" />
                <span>{project.endDate ? `Due ${new Date(project.endDate).toLocaleDateString()}` : "No end date"}</span>
              </div>
              <span className="font-medium text-primary">${project.budget.toLocaleString()}</span>
            </div>
            <div className="text-xs text-muted-foreground">Client: {project.client?.name || "No client"}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="dashboard-header">
          <div className="flex items-center gap-2 font-semibold">
            <Construction className="h-5 w-5" />
            Projects
          </div>
        </header>
        <div className="loading-spinner">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <header className="dashboard-header">
          <div className="flex items-center gap-2 font-semibold">
            <Construction className="h-5 w-5" />
            Projects
          </div>
        </header>
        <div className="p-6">
          <div className="error-state">
            <p className="text-destructive font-medium">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="dashboard-header">
        <div className="flex items-center gap-2 font-semibold">
          <Construction className="h-5 w-5" />
          Projects
        </div>
        <div className="ml-auto flex items-center gap-4">
          {/* 
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          */}
          <Button size="sm" asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search projects..." className="w-full bg-background pl-8" />
            </div>
          </div> */}

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Projects</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filterProjectsByStatus("all").length > 0 ? (
                  filterProjectsByStatus("all").map((project) => <ProjectCard key={project.id} project={project} />)
                ) : (
                  <div className="col-span-3 empty-state">
                    <Construction className="h-12 w-12 text-muted-foreground" />
                    <h3 className="page-title">No projects found</h3>
                    <p className="page-subtitle">Create a new project to get started.</p>
                    <Button className="mt-4" asChild>
                      <Link href="/projects/new">Create Project</Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filterProjectsByStatus("ACTIVE").length > 0 ? (
                  filterProjectsByStatus("ACTIVE").map((project) => <ProjectCard key={project.id} project={project} />)
                ) : (
                  <div className="col-span-3 empty-state">
                    <Construction className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No active projects</h3>
                    <p className="text-sm text-muted-foreground">Active projects will appear here.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="planning" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filterProjectsByStatus("PLANNING").length > 0 ? (
                  filterProjectsByStatus("PLANNING").map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))
                ) : (
                  <div className="col-span-3 empty-state">
                    <Construction className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No projects in planning</h3>
                    <p className="text-sm text-muted-foreground">Projects in planning phase will appear here.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filterProjectsByStatus("COMPLETED").length > 0 ? (
                  filterProjectsByStatus("COMPLETED").map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))
                ) : (
                  <div className="col-span-3 empty-state">
                    <Construction className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No completed projects</h3>
                    <p className="text-sm text-muted-foreground">Completed projects will appear here.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
