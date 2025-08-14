import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, ShoppingCart, Truck, AlertTriangle, TrendingUp, Users, FileText, Plus } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'

async function getMaterialDashboardStats() {
  const [
    totalMaterials,
    activeMaterials,
    totalSuppliers,
    activeSuppliers,
    pendingRequests,
    approvedRequests,
    issuedRequests,
    completedRequests,
    lowStockMaterials,
    recentRequests,
    topRequestedMaterials
  ] = await Promise.all([
    prisma.material.count(),
    prisma.material.count({ where: { isActive: true } }),
    prisma.supplier.count(),
    prisma.supplier.count({ where: { isActive: true } }),
    prisma.materialRequest.count({ where: { status: 'PENDING' } }),
    prisma.materialRequest.count({ where: { status: 'APPROVED' } }),
    prisma.materialRequest.count({ where: { status: 'ISSUED' } }),
    prisma.materialRequest.count({ where: { status: 'COMPLETED' } }),
    prisma.material.findMany({
      where: {
        isActive: true,
        inventory: {
          some: {
            // Compare currentStock to the material's minimumStockLevel
            currentStock: {
              lt: prisma.material.fields.minimumStockLevel
            }
          }
        }
      },
      take: 10
    }),
    prisma.materialRequest.findMany({
      include: {
        material: { select: { name: true, materialCode: true } },
        project: { select: { name: true } },
        requestedBy: { select: { firstName: true, lastName: true } }
      },
      orderBy: { requestDate: 'desc' },
      take: 5
    }),
    prisma.materialRequest.groupBy({
      by: ['materialId'],
      _count: { materialId: true },
      _sum: { requestedQuantity: true },
      orderBy: { _count: { materialId: 'desc' } },
      take: 5
    })
  ])

  return {
    totalMaterials,
    activeMaterials,
    totalSuppliers,
    activeSuppliers,
    pendingRequests,
    approvedRequests,
    issuedRequests,
    completedRequests,
    lowStockMaterials: lowStockMaterials.length,
    recentRequests,
    topRequestedMaterials
  }
}

export default async function MaterialManagementPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }

  const stats = await getMaterialDashboardStats()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Material Management</h1>
          <p className="text-muted-foreground">
            Manage materials, suppliers, inventory, and requests
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/material-management/requests/new">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/material-management/materials/new">
              <Package className="h-4 w-4 mr-2" />
              Add Material
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaterials}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeMaterials} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSuppliers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedRequests} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.lowStockMaterials}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Recent Requests</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Request Status Distribution</CardTitle>
                <CardDescription>Current status of material requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{stats.pendingRequests}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Approved</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{stats.approvedRequests}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Issued</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{stats.issuedRequests}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{stats.completedRequests}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common material management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/material-management/requests">
                    <FileText className="h-4 w-4 mr-2" />
                    View All Requests
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/material-management/materials">
                    <Package className="h-4 w-4 mr-2" />
                    Manage Materials
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/material-management/inventory">
                    <Truck className="h-4 w-4 mr-2" />
                    Check Inventory
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/material-management/suppliers">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Suppliers
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Material Requests</CardTitle>
              <CardDescription>Latest material requests in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{request.requestNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.material.name} - {Number(request.requestedQuantity)} units
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested by {request.requestedBy.firstName} {request.requestedBy.lastName}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge 
                        variant={
                          request.status === 'PENDING' ? 'secondary' :
                          request.status === 'APPROVED' ? 'default' :
                          request.status === 'COMPLETED' ? 'secondary' : 'outline'
                        }
                      >
                        {request.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.requestDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {stats.recentRequests.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No recent requests found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Alerts</CardTitle>
              <CardDescription>Materials that need attention</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.lowStockMaterials > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">
                      {stats.lowStockMaterials} materials are running low on stock
                    </span>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/material-management/inventory?filter=low-stock">
                      View Low Stock Items
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">All materials are well stocked</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No materials are below minimum stock levels
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
