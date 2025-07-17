"use client"

import type * as React from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import {
  Building2,
  Users,
  Wrench,
  Fuel,
  FileText,
  Settings,
  Calendar,
  UserCircle,
  Home,
  Activity,
  Receipt,
  TrendingUp,
  Shield,
} from "lucide-react"
import { NavUser } from "@/components/nav-user"
import { Logo } from "@/components/brand/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Role-based navigation data (refactored for dynamic roles)
const NAV_ITEMS = [
  { title: "Dashboard", url: "/", icon: Home, roles: ["Admin", "Project Manager", "Employee", "Store Manager"] },
  { title: "Projects", url: "/projects", icon: Building2, roles: ["Admin", "Project Manager", "Employee"] },
  { title: "Activities", url: "/activities", icon: Activity, roles: ["Admin", "Project Manager", "Employee"] },
  { title: "Employees", url: "/employees", icon: Users, roles: ["Admin", "Project Manager"] },
  { title: "Equipment", url: "/equipment", icon: Wrench, roles: ["Admin", "Project Manager", "Store Manager"] },
  { title: "Fuel Management", url: "/fuel-management", icon: Fuel, roles: ["Admin", "Project Manager", "Store Manager", "Employee"] },
  { title: "Clients", url: "/clients", icon: UserCircle, roles: ["Admin", "Project Manager"] },
  { title: "Invoices", url: "/invoices", icon: Receipt, roles: ["Admin"] },
  { title: "Reports", url: "/reports", icon: FileText, roles: ["Admin"] },
  { title: "Users", url: "/users", icon: Shield, roles: ["Admin"] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ["Admin"] },
];

const getNavigationItems = (userRole?: string) => {
  const role = userRole || "Employee";
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({ isMobile = false, onNavigate, ...props }: AppSidebarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const userRole = session?.user?.role || "USER";
  const navigationItems = getNavigationItems(userRole);

  const user = {
    name: session?.user?.name || "Construction Manager",
    email: session?.user?.email || "manager@construction.com",
    avatar: session?.user?.image || "/placeholder.svg?height=32&width=32",
    role: userRole,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[Sidebar] Session:", session);
    console.log("[Sidebar] Role:", userRole);
    console.log("[Sidebar] Navigation Items:", navigationItems);
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  const handleNavigation = () => {
    if (typeof onNavigate === "function") {
      onNavigate();
    }
  };

  return (
    <Sidebar collapsible={isMobile ? "none" : "icon"} className={cn("border-r", isMobile && "border-r-0")} {...props}>
      <SidebarHeader className="border-b p-4">
        <Logo size="sm" showText={true} />
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarMenu className="space-y-1">
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={!isMobile ? item.title : undefined}
                  className={cn(
                    "h-10 px-3 rounded-lg transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    pathname === item.url && "bg-accent text-accent-foreground font-medium",
                  )}
                >
                  <Link href={item.url} className="flex items-center gap-3" onClick={handleNavigation}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <NavUser user={user} />
      </SidebarFooter>

      {!isMobile && <SidebarRail />}
    </Sidebar>
  );
}
