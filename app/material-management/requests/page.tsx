'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Search, Plus, Eye, CheckCircle, XCircle, Clock, Truck, Filter } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { MaterialRequestWithRelations } from '@/types/material-management'

const statusConfig = {
  PENDING: { color: 'secondary' as const, icon: Clock },
  APPROVED: { color: 'default' as const, icon: CheckCircle },
  REJECTED: { color: 'destructive' as const, icon: XCircle },
  ISSUED: { color: 'default' as const, icon: Truck },
  ACKNOWLEDGED: { color: 'default' as const, icon: CheckCircle },
  COMPLETED: { color: 'secondary' as const, icon: CheckCircle },
  CANCELLED: { color: 'secondary' as const, icon: XCircle },
}

const urgencyConfig = {
  LOW: { color: 'secondary' as const },
  NORMAL: { color: 'default' as const },
  HIGH: { color: 'secondary' as const },
  CRITICAL: { color: 'destructive' as const },
}

export default function MaterialRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<MaterialRequestWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(urgencyFilter && { urgency: urgencyFilter }),
        ...(projectFilter && { projectId: projectFilter }),
      })

      const response = await fetch(`/api/material-requests?${params}`)
      const data = await response.json()

      if (data.success) {
        setRequests(data.data)
        setTotalPages(data.pagination.pages)
      } else {
        toast.error('Failed to fetch material requests')
      }
    } catch (error) {
      console.error('Error fetching material requests:', error)
      toast.error('Failed to fetch material requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [page, search, statusFilter, urgencyFilter, projectFilter])

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(amount))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Material Requests</h1>
          <p className="text-muted-foreground">
            Manage material requests and approvals
          </p>
        </div>
        <Button asChild>
          <Link href="/material-management/requests/new">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ISSUED">Issued</SelectItem>
                <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Urgency</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Projects</SelectItem>
                {/* Add project options dynamically */}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Requests</CardTitle>
          <CardDescription>
            {requests.length} requests found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const StatusIcon = statusConfig[request.status].icon;
                  // Convert Decimal values to number for rendering
                  const requestedQuantity = request.requestedQuantity != null ? Number(request.requestedQuantity) : null;
                  const approvedQuantity = request.approvedQuantity != null ? Number(request.approvedQuantity) : null;
                  const totalCost = request.totalCost != null ? Number(request.totalCost) : null;
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.requestNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.material.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.material.materialCode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.project.name}</p>
                          {request.project.projectCode && (
                            <p className="text-sm text-muted-foreground">
                              {request.project.projectCode}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{requestedQuantity} {request.material.unit}</p>
                          {approvedQuantity !== null && (
                            <p className="text-sm text-muted-foreground">
                              Approved: {approvedQuantity}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(totalCost)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={urgencyConfig[request.urgency].color}>
                          {request.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge variant={statusConfig[request.status].color}>
                            {request.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {request.requestedBy.firstName} {request.requestedBy.lastName}
                          </p>
                          {request.requestedBy.employee && (
                            <p className="text-sm text-muted-foreground">
                              {request.requestedBy.employee.designation}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(request.requestDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/material-management/requests/${request.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No material requests found</p>
                        <Button asChild>
                          <Link href="/material-management/requests/new">
                            Create your first request
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
