"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Fuel, Plus, Search, Filter, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { getFuelRequests } from "@/app/actions/fuel-actions"
import { FuelApprovalButton } from "@/components/fuel-approval-button"
import { useSession } from "next-auth/react"

interface FuelRequest {
  id: number
  equipment: {
    name: string
    equipmentNumber: string
  }
  project: {
    id: number
    name: string
  }
  fuelType: string
  quantity: number
  status: string
  urgency: string
  requestedBy: {
    firstName: string
    lastName: string
    employeeNumber: string
  }
}

export default function FuelManagementPage() {
  const { data: session } = useSession()
  const [fuelRequests, setFuelRequests] = useState<FuelRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFuelRequests = async () => {
      try {
        const result = await getFuelRequests()
        if (result.success && result.data) {
          setFuelRequests(result.data)
        } else {
          setError(result.error || "Failed to load fuel requests")
        }
      } catch (err) {
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchFuelRequests()
  }, [])

  const canApprove = session?.user && ["Admin", "Project Manager"].includes(session.user.role)

  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="dashboard-header">
          <div className="flex items-center gap-2 font-semibold">
            <Fuel className="h-5 w-5" />
            Fuel Management
          </div>
        </header>
        <div className="loading-spinner">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading fuel requests...</p>
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
            <Fuel className="h-5 w-5" />
            Fuel Management
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
          <Fuel className="h-5 w-5" />
          Fuel Management
        </div>
        <div className="ml-auto flex items-center gap-4">
          {/* 
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          */}
          <Button size="sm" asChild>
            <Link href="/fuel-management/request">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Fuel className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{fuelRequests?.length || 0}</div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {fuelRequests?.filter((req) => req.status === "PENDING").length || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {fuelRequests?.filter((req) => req.status === "APPROVED").length || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {fuelRequests?.filter((req) => req.status === "REJECTED").length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters 
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search fuel requests..." className="w-full bg-background pl-8" />
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div> */}

          {/* Fuel Requests Table */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>Fuel Requests</CardTitle>
              <CardDescription>
                Manage fuel requests and approvals ({fuelRequests?.length || 0} requests)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelRequests && fuelRequests.length > 0 ? (
                    fuelRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.equipment.name}</p>
                            <p className="text-sm text-muted-foreground">{request.equipment.equipmentNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/projects/${request.project.id}`}
                            className="font-medium hover:underline text-primary"
                          >
                            {request.project.name}
                          </Link>
                        </TableCell>
                        <TableCell>{request.fuelType}</TableCell>
                        <TableCell className="font-medium">{request.quantity}L</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {request.requestedBy.firstName} {request.requestedBy.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{request.requestedBy.employeeNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "APPROVED"
                                ? "default"
                                : request.status === "REJECTED"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={request.urgency === "HIGH" ? "destructive" : "outline"}
                            className={
                              request.urgency === "HIGH"
                                ? "bg-red-100 text-red-800"
                                : request.urgency === "MEDIUM"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }
                          >
                            {request.urgency}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {canApprove && request.status === "PENDING" && <FuelApprovalButton requestId={request.id} />}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="empty-state">
                          <Fuel className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">No fuel requests found</p>
                          <Button asChild className="mt-4">
                            <Link href="/fuel-management/request">Create First Request</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
