"use client"

// Excel/CSV Export Utilities
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data to export")
    return
  }

  // Get headers from the first object
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Handle values that might contain commas or quotes
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ""
        })
        .join(","),
    ),
  ].join("\n")

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function exportToExcel(data: any[], filename: string, sheetName = "Sheet1") {
  if (!data || data.length === 0) {
    alert("No data to export")
    return
  }

  // Create a simple Excel-compatible format using HTML table
  const headers = Object.keys(data[0])

  const excelContent = `
    <table>
      <thead>
        <tr>
          ${headers.map((header) => `<th>${header}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (row) => `
          <tr>
            ${headers.map((header) => `<td>${row[header] || ""}</td>`).join("")}
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `

  // Create and download file
  const blob = new Blob([excelContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  })

  const link = document.createElement("a")
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.xls`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Format data for export
export function formatDataForExport(
  data: any[],
  type: "employees" | "equipment" | "projects" | "clients" | "activities" | "fuel-requests",
) {
  if (!data || data.length === 0) return []

  switch (type) {
    case "employees":
      return data.map((emp) => ({
        "Employee Number": emp.employeeNumber,
        "First Name": emp.firstName,
        "Last Name": emp.lastName,
        Section: emp.section,
        Designation: emp.designation,
        Gender: emp.gender,
        "Employment Terms": emp.employmentTerms,
        "Wage Amount": emp.wageAmount,
        "Wage Frequency": emp.wageFrequency,
        "Date of Appointment": emp.dateOfAppointment ? new Date(emp.dateOfAppointment).toLocaleDateString() : "",
        Status: emp.user?.isActive ? "Active" : "Inactive",
      }))

    case "equipment":
      return data.map((eq) => ({
        "Equipment Code": eq.equipmentCode,
        Name: eq.name,
        Type: eq.type,
        Make: eq.make,
        Model: eq.model,
        Status: eq.status,
        "Year of Manufacture": eq.yearOfManufacture,
        Ownership: eq.ownership,
        Size: eq.size,
        Unit: eq.unit,
        "Purchase Date": eq.purchaseDate ? new Date(eq.purchaseDate).toLocaleDateString() : "",
        "Purchase Price": eq.purchasePrice,
      }))

    case "projects":
      return data.map((proj) => ({
        "Project Code": proj.projectCode,
        Name: proj.name,
        Description: proj.description,
        Status: proj.status,
        Budget: proj.budget,
        "Start Date": proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "",
        "End Date": proj.endDate ? new Date(proj.endDate).toLocaleDateString() : "",
        Location: proj.location,
        Client: proj.client?.name || "N/A",
        "Created Date": new Date(proj.createdAt).toLocaleDateString(),
      }))

    case "clients":
      return data.map((client) => ({
        Name: client.name,
        "Contact Name": client.contactName,
        Email: client.email,
        Phone: client.phone,
        Address: client.address,
        "Projects Count": client.projects?.length || 0,
        "Created Date": new Date(client.createdAt).toLocaleDateString(),
      }))

    case "activities":
      return data.map((activity) => ({
        Name: activity.name,
        Description: activity.description,
        Status: activity.status,
        "Start Date": activity.startDate ? new Date(activity.startDate).toLocaleDateString() : "",
        "End Date": activity.endDate ? new Date(activity.endDate).toLocaleDateString() : "",
        Project: activity.project?.name || "N/A",
        "Project Code": activity.project?.projectCode || "N/A",
        Employee: activity.employee ? `${activity.employee.firstName} ${activity.employee.lastName}` : "N/A",
        "Created Date": new Date(activity.createdAt).toLocaleDateString(),
      }))

    case "fuel-requests":
      return data.map((req) => ({
        "Request Number": req.requestNumber || `FR-${req.id}`,
        "Fuel Type": req.fuelType,
        "Requested Quantity": req.requestedQuantity || req.quantity,
        "Approved Quantity": req.approvedQuantity || "N/A",
        "Issued Quantity": req.issuedQuantity || "N/A",
        Status: req.status,
        Urgency: req.urgency,
        Purpose: req.purpose || req.justification,
        Equipment: req.equipment?.name || "N/A",
        Project: req.project?.name || "N/A",
        "Requested By": req.requestedBy ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : "N/A",
        "Request Date": req.requestDate
          ? new Date(req.requestDate).toLocaleDateString()
          : new Date(req.createdAt).toLocaleDateString(),
      }))

    default:
      return data
  }
}
