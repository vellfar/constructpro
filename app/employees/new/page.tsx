import { EmployeeForm } from "@/components/employee-form"

export default function NewEmployeePage() {
  return <EmployeeForm mode="create" />
}
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}