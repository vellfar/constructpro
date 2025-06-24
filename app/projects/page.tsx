"use client"

import { Button } from "@/components/ui/button"

import { Plus, Filter, Download } from "lucide-react"
import { exportToCSV, exportToExcel, formatDataForExport } from "@/lib/export-utils"

const ProjectsPage = () => {
  const projects = [
    { id: 1, name: "Project A", location: "New York", budget: 100000, teamSize: 5 },
    { id: 2, name: "Project B", location: "Los Angeles", budget: 150000, teamSize: 8 },
  ]

  const handleExportCSV = () => {
    const exportData = formatDataForExport(projects, "projects")
    exportToCSV(exportData, `projects-${new Date().toISOString().split("T")[0]}`)
  }

  const handleExportExcel = () => {
    const exportData = formatDataForExport(projects, "projects")
    exportToExcel(exportData, `projects-${new Date().toISOString().split("T")[0]}`, "Projects")
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProjectsPage
