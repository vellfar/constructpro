import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit, MapPin, Calendar, Fuel, Wrench } from "lucide-react"
import Link from "next/link"
import { getEquipmentById } from "@/app/actions/equipment-actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const equipmentId = Number.parseInt(params.id)
  const { success, data: equipment, error } = await getEquipmentById(equipmentId)

  if (!success || !equipment) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/equipment" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">{equipment.name}</div>
        <div className="ml-auto flex items-center gap-4">
          <Button size="sm" asChild>
            <Link href={`/equipment/${equipment.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Equipment
            </Link>
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{equipment.name}</CardTitle>
                    <CardDescription>
                      {equipment.type} • {equipment.make} {equipment.model}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      equipment.status === "OPERATIONAL"
                        ? "default"
                        : equipment.status === "UNDER_MAINTENANCE"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {equipment.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Equipment Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Equipment Code:</span>
                        <span className="font-medium">{equipment.equipmentCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year:</span>
                        <span>{equipment.yearOfManufacture || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ownership:</span>
                        <span>{equipment.ownership}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span>
                          {equipment.size} {equipment.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Work Measure:</span>
                        <span>{equipment.workMeasure}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acquisition Cost:</span>
                        <span>${equipment.acquisitionCost?.toLocaleString() || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supplier:</span>
                        <span>{equipment.supplier || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date Received:</span>
                        <span>
                          {equipment.dateReceived ? new Date(equipment.dateReceived).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="assignments" className="space-y-4">
              <TabsList>
                <TabsTrigger value="assignments">Project Assignments</TabsTrigger>
                <TabsTrigger value="fuel">Fuel Requests</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="locations">Location History</TabsTrigger>
              </TabsList>

              <TabsContent value="assignments">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Assignments</CardTitle>
                    <CardDescription>Current and past project assignments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Assigned By</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipment.assignments && equipment.assignments.length > 0 ? (
                          equipment.assignments.map((assignment) => (
                            <TableRow key={assignment.id}>
                              <TableCell>
                                <Link
                                  href={`/projects/${assignment.project.id}`}
                                  className="font-medium hover:underline"
                                >
                                  {assignment.project.name}
                                </Link>
                              </TableCell>
                              <TableCell>{new Date(assignment.startDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : "Ongoing"}
                              </TableCell>
                              <TableCell>{assignment.assignedBy}</TableCell>
                              <TableCell>
                                <Badge variant={assignment.endDate ? "secondary" : "default"}>
                                  {assignment.endDate ? "Completed" : "Active"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              No project assignments found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fuel">
                <Card>
                  <CardHeader>
                    <CardTitle>Fuel Requests</CardTitle>
                    <CardDescription>Fuel consumption and requests history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Fuel Type</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Project</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipment.fuelRequests && equipment.fuelRequests.length > 0 ? (
                          equipment.fuelRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{request.requestNumber}</TableCell>
                              <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>{request.fuelType}</TableCell>
                              <TableCell>{request.quantity}L</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    request.status === "APPROVED"
                                      ? "default"
                                      : request.status === "PENDING"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {request.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{request.project.name}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                              No fuel requests found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="maintenance">
                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance History</CardTitle>
                    <CardDescription>Equipment assessments and maintenance records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Functionality</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead>Insurance</TableHead>
                          <TableHead>Assessed By</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipment.assessments && equipment.assessments.length > 0 ? (
                          equipment.assessments.map((assessment) => (
                            <TableRow key={assessment.id}>
                              <TableCell>{new Date(assessment.assessmentDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant="default">Assessment</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">N/A</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">N/A</Badge>
                              </TableCell>
                              <TableCell>{assessment.assessor}</TableCell>
                              <TableCell className="max-w-xs truncate">{assessment.notes || "N/A"}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                              No maintenance records found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="locations">
                <Card>
                  <CardHeader>
                    <CardTitle>Location History</CardTitle>
                    <CardDescription>Equipment movement and location tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date Moved</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Officer</TableHead>
                          <TableHead>Authorizing Officer</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipment.locations && equipment.locations.length > 0 ? (
                          equipment.locations.map((location) => (
                            <TableRow key={location.id}>
                              <TableCell>{new Date(location.startDate).toLocaleDateString()}</TableCell>
                              <TableCell className="font-medium">{location.location}</TableCell>
                              <TableCell>N/A</TableCell>
                              <TableCell>N/A</TableCell>
                              <TableCell className="max-w-xs truncate">{location.notes || "N/A"}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              No location history found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Current Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {equipment.locations && equipment.locations.length > 0
                    ? equipment.locations[0].location
                    : "Location not tracked"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Fuel Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Work Measure:</span>
                    <span className="font-medium">{equipment.workMeasure}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Requests:</span>
                    <span className="font-medium">{equipment.fuelRequests?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Maintenance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Last Assessment:</span>
                    <span className="font-medium">
                      {equipment.assessments && equipment.assessments.length > 0
                        ? new Date(equipment.assessments[0].assessmentDate).toLocaleDateString()
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Assessor:</span>
                    <span className="font-medium">
                      {equipment.assessments && equipment.assessments.length > 0
                        ? equipment.assessments[0].assessor
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Projects:</span>
                    <span className="font-medium">{equipment.assignments?.filter((a) => !a.endDate).length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Assignments:</span>
                    <span className="font-medium">{equipment.assignments?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Years in Service:</span>
                    <span className="font-medium">
                      {equipment.yearOfManufacture ? new Date().getFullYear() - equipment.yearOfManufacture : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
