import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { updateEquipment } from "@/app/actions/equipment-actions"
import EquipmentEditForm from "@/components/equipment-edit-form"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EditEquipmentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login")
  }

  const equipmentId = Number.parseInt(params.id)
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    include: {
      assessments: {
        orderBy: { assessmentDate: "desc" },
      },
      locations: {
        orderBy: { startDate: "desc" },
      },
    },
  })

  if (!equipment) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href={`/equipment/${equipment.id}`}> 
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Equipment
          </Button>
        </Link>
        <div className="flex items-center gap-2 font-semibold">Edit Equipment</div>
      </header>
      <div className="p-6">
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Edit Equipment</CardTitle>
            <CardDescription>Update equipment information</CardDescription>
          </CardHeader>
          <EquipmentEditForm equipment={equipment} />
        </Card>
      </div>
    </div>
  )
}
