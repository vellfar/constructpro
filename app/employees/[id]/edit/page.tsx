import { notFound } from "next/navigation"
import { getEmployee } from "@/app/actions/employee-actions"
import { EmployeeForm } from "@/components/employee-form"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const employeeId = Number.parseInt(params.id)
  const result = await getEmployee(employeeId)

  if (!result.success || !result.data) {
    notFound()
  }

  return <EmployeeForm employee={result.data} mode="edit" />
}
