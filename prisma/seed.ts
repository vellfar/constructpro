import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting minimal database seeding (roles only)...")

  try {
    // Create roles only
    console.log("Creating roles...")

    const adminRole = await prisma.role.upsert({
      where: { name: "Admin" },
      update: {},
      create: {
        name: "Admin",
        description: "System administrator with full access to all features and settings",
      },
    })

    const projectManagerRole = await prisma.role.upsert({
      where: { name: "Project Manager" },
      update: {},
      create: {
        name: "Project Manager",
        description: "Manages construction projects, assigns resources, and oversees operations",
      },
    })

    const employeeRole = await prisma.role.upsert({
      where: { name: "Employee" },
      update: {},
      create: {
        name: "Employee",
        description: "Regular employee with access to assigned tasks and basic features",
      },
    })

    const storeManagerRole = await prisma.role.upsert({
      where: { name: "Store Manager" },
      update: {},
      create: {
        name: "Store Manager",
        description: "Manages fuel and equipment stores, handles inventory and approvals",
      },
    })

    // Create basic permissions
    console.log("Creating basic permissions...")

    const permissions = [
      // User management permissions
      { name: "user.create", description: "Can create new users" },
      { name: "user.read", description: "Can view user information" },
      { name: "user.update", description: "Can update user information" },
      { name: "user.delete", description: "Can delete users" },

      // Project management permissions
      { name: "project.create", description: "Can create new projects" },
      { name: "project.read", description: "Can view project details" },
      { name: "project.update", description: "Can update project information" },
      { name: "project.delete", description: "Can delete projects" },
      { name: "project.manage", description: "Can manage all project aspects" },

      // Equipment management permissions
      { name: "equipment.create", description: "Can add new equipment" },
      { name: "equipment.read", description: "Can view equipment information" },
      { name: "equipment.update", description: "Can update equipment details" },
      { name: "equipment.delete", description: "Can remove equipment" },
      { name: "equipment.assign", description: "Can assign equipment to projects" },
      { name: "equipment.use", description: "Can operate equipment" },

      // Fuel management permissions
      { name: "fuel.request", description: "Can request fuel for equipment" },
      { name: "fuel.approve", description: "Can approve fuel requests" },
      { name: "fuel.issue", description: "Can issue approved fuel" },
      { name: "fuel.manage", description: "Can manage fuel inventory" },

      // Employee management permissions
      { name: "employee.create", description: "Can add new employees" },
      { name: "employee.read", description: "Can view employee information" },
      { name: "employee.update", description: "Can update employee details" },
      { name: "employee.delete", description: "Can remove employees" },

      // Client management permissions
      { name: "client.create", description: "Can add new clients" },
      { name: "client.read", description: "Can view client information" },
      { name: "client.update", description: "Can update client details" },
      { name: "client.delete", description: "Can remove clients" },

      // Activity management permissions
      { name: "activity.create", description: "Can create new activities" },
      { name: "activity.read", description: "Can view activity details" },
      { name: "activity.update", description: "Can update activities" },
      { name: "activity.delete", description: "Can delete activities" },

      // Invoice management permissions
      { name: "invoice.create", description: "Can create invoices" },
      { name: "invoice.read", description: "Can view invoices" },
      { name: "invoice.update", description: "Can update invoices" },
      { name: "invoice.delete", description: "Can delete invoices" },

      // Report permissions
      { name: "report.view", description: "Can view reports" },
      { name: "report.generate", description: "Can generate reports" },
      { name: "report.export", description: "Can export reports" },

      // Analytics permissions
      { name: "analytics.view", description: "Can view analytics dashboard" },
      { name: "analytics.advanced", description: "Can access advanced analytics" },

      // System permissions
      { name: "system.settings", description: "Can access system settings" },
      { name: "system.audit", description: "Can view audit logs" },
      { name: "system.backup", description: "Can perform system backups" },
    ]

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      })
    }


    // Assign permissions to roles
    // Define which permissions each role should have
    const rolePermissionsMap: Record<string, string[]> = {
      "Admin": permissions.map(p => p.name), // Admin gets all permissions
      "Project Manager": [
        "project.create", "project.read", "project.update", "project.delete", "project.manage",
        "equipment.read", "equipment.assign", "equipment.use",
        "fuel.request", "fuel.approve", "fuel.issue", "fuel.manage",
        "employee.read", "employee.update",
        "client.read", "client.update",
        "activity.create", "activity.read", "activity.update",
        "invoice.create", "invoice.read", "invoice.update",
        "report.view", "report.generate", "report.export",
        "analytics.view",
      ],
      "Employee": [
        "project.read",
        "equipment.read", "equipment.use",
        "fuel.request",
        "employee.read",
        "client.read",
        "activity.read",
        "invoice.read",
        "report.view",
      ],
      "Store Manager": [
        "equipment.read", "equipment.update", "equipment.assign", "equipment.use",
        "fuel.request", "fuel.approve", "fuel.issue", "fuel.manage",
        "report.view",
      ],
    };

    // Fetch all roles and permissions from DB
    const allRoles = await prisma.role.findMany();
    const allPermissions = await prisma.permission.findMany();

    for (const role of allRoles) {
      const perms = rolePermissionsMap[role.name] || [];
      for (const permName of perms) {
        const perm = allPermissions.find(p => p.name === permName);
        if (perm) {
          await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
            update: {},
            create: { roleId: role.id, permissionId: perm.id },
          });
        }
      }
    }

    console.log("✅ Permissions assigned to roles successfully!")

    console.log("\n🎉 Minimal database seeding completed successfully!")
    console.log("\n📋 Summary:")
    console.log(`• ${await prisma.role.count()} roles created`)
    console.log(`• ${await prisma.permission.count()} permissions created`)
    console.log("\n🔑 Available Roles:")
    console.log("┌─────────────────┬─────────────────────────────────────────────────────────┐")
    console.log("│ Role Name       │ Description                                             │")
    console.log("├─────────────────┼─────────────────────────────────────────────────────────┤")
    console.log("│ Admin           │ System administrator with full access                  │")
    console.log("│ Project Manager │ Manages projects and oversees operations               │")
    console.log("│ Store Manager   │ Manages fuel and equipment stores                      │")
    console.log("│ Supervisor      │ Supervises field operations                            │")
    console.log("│ Operator        │ Equipment operator                                      │")
    console.log("│ Employee        │ Regular employee with basic access                     │")
    console.log("└─────────────────┴─────────────────────────────────────────────────────────┘")
    console.log("\n💡 Next Steps:")
    console.log("1. Create your first admin user through the registration page")
    console.log("2. Use the admin account to create other users and assign roles")
    console.log("3. Start adding clients, projects, and equipment through the UI")
  } catch (error) {
    console.error("❌ Error during minimal seeding:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error("❌ Minimal seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
