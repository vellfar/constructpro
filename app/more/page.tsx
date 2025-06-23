"use client"

import Link from "next/link"
import { Users, Fuel, Calendar, BarChart3, FileText, Settings, UserCheck, Receipt } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { MobileHeader } from "@/components/mobile-header"

const moreItems = [
  {
    title: "Employees",
    href: "/employees",
    icon: UserCheck,
    description: "Manage team members",
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
    description: "Client management",
  },
  {
    title: "Fuel Management",
    href: "/fuel-management",
    icon: Fuel,
    description: "Track fuel requests",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    description: "Schedule & events",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Performance metrics",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    description: "Generate reports",
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: Receipt,
    description: "Billing & invoices",
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    description: "User management",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "System settings",
  },
]

export default function MorePage() {
  return (
    <div className="lg:hidden">
      <MobileHeader title="More" />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {moreItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:bg-accent transition-colors">
                <CardContent className="flex flex-col items-center text-center p-4 space-y-2">
                  <item.icon className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
