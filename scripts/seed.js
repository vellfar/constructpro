const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding...")

  try {
    // Create roles first
    console.log("Creating roles...")
    const adminRole = await prisma.role.upsert({
      where: { name: "Admin" },
      update: {},
      create: {
        name: "Admin",
        description: "System administrator with full access",
      },
    })

    const projectManagerRole = await prisma.role.upsert({
      where: { name: "Project Manager" },
      update: {},
      create: {
        name: "Project Manager",
        description: "Manages construction projects",
      },
    })

    const employeeRole = await prisma.role.upsert({
      where: { name: "Employee" },
      update: {},
      create: {
        name: "Employee",
        description: "Regular employee",
      },
    })

    console.log("✅ Created roles successfully")

    // Create permissions
    console.log("Creating permissions...")
    const permissions = [
      { name: "user.create", description: "Can create users" },
      { name: "user.read", description: "Can read users" },
      { name: "user.update", description: "Can update users" },
      { name: "user.delete", description: "Can delete users" },
      { name: "fuel.approve", description: "Can approve fuel requests" },
      { name: "fuel.issue", description: "Can issue fuel" },
      { name: "fuel.request", description: "Can request fuel" },
      { name: "project.manage", description: "Can manage projects" },
      { name: "project.read", description: "Can read project details" },
      { name: "project.update", description: "Can update project details" },
      { name: "equipment.assign", description: "Can assign equipment" },
      { name: "equipment.use", description: "Can use equipment" },
    ]

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      })
    }

    console.log("✅ Created permissions successfully")

    // Create employees
    console.log("Creating employees...")
    const employee1 = await prisma.employee.upsert({
      where: { employeeNumber: "EMP001" },
      update: {},
      create: {
        employeeNumber: "EMP001",
        firstName: "John",
        lastName: "Doe",
        dateOfAppointment: new Date("2022-01-15"),
        section: "Engineering",
        designation: "Site Engineer",
        wageAmount: 5000,
        wageFrequency: "Monthly",
        gender: "Male",
        bank: "National Bank",
        accountNumber: "1234567890",
        bankBranch: "Main Branch",
        employmentTerms: "Permanent",
      },
    })

    const employee2 = await prisma.employee.upsert({
      where: { employeeNumber: "EMP002" },
      update: {},
      create: {
        employeeNumber: "EMP002",
        firstName: "Jane",
        lastName: "Smith",
        dateOfAppointment: new Date("2022-02-20"),
        section: "Management",
        designation: "Project Manager",
        wageAmount: 7500,
        wageFrequency: "Monthly",
        gender: "Female",
        bank: "City Bank",
        accountNumber: "0987654321",
        bankBranch: "Downtown Branch",
        employmentTerms: "Permanent",
      },
    })

    const employee3 = await prisma.employee.upsert({
      where: { employeeNumber: "EMP003" },
      update: {},
      create: {
        employeeNumber: "EMP003",
        firstName: "Michael",
        lastName: "Brown",
        dateOfAppointment: new Date("2021-08-10"),
        section: "Operations",
        designation: "Equipment Operator",
        wageAmount: 4200,
        wageFrequency: "Monthly",
        gender: "Male",
        bank: "Regional Bank",
        accountNumber: "5555666677",
        bankBranch: "Industrial Branch",
        employmentTerms: "Permanent",
      },
    })

    console.log("✅ Created employees successfully")

    // Hash password for users
    const hashedPassword = await bcrypt.hash("password123", 12)

    // Create users
    console.log("Creating users...")
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        username: "admin",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        phoneNumber: "1234567890",
        roleId: adminRole.id,
        isActive: true,
      },
    })

    const pmUser = await prisma.user.upsert({
      where: { email: "pm@example.com" },
      update: {},
      create: {
        email: "pm@example.com",
        username: "projectmanager",
        password: hashedPassword,
        firstName: "Jane",
        lastName: "Smith",
        phoneNumber: "0987654321",
        roleId: projectManagerRole.id,
        employeeId: employee2.id,
        isActive: true,
      },
    })

    const empUser = await prisma.user.upsert({
      where: { email: "john@example.com" },
      update: {},
      create: {
        email: "john@example.com",
        username: "johndoe",
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "1122334455",
        roleId: employeeRole.id,
        employeeId: employee1.id,
        isActive: true,
      },
    })

    const operatorUser = await prisma.user.upsert({
      where: { email: "michael@example.com" },
      update: {},
      create: {
        email: "michael@example.com",
        username: "michaelbrown",
        password: hashedPassword,
        firstName: "Michael",
        lastName: "Brown",
        phoneNumber: "2233445566",
        roleId: employeeRole.id,
        employeeId: employee3.id,
        isActive: true,
      },
    })

    console.log("✅ Created users successfully")

    // Create clients
    console.log("Creating clients...")
    const client1 = await prisma.client.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: "Ministry of Infrastructure",
        contactName: "Robert Johnson",
        email: "robert@ministry.gov",
        phone: "1234567890",
        address: "123 Government St, Capital City",
      },
    })

    const client2 = await prisma.client.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: "City Development Authority",
        contactName: "Sarah Williams",
        email: "sarah@citydev.gov",
        phone: "0987654321",
        address: "456 City Hall Ave, Metro City",
      },
    })

    console.log("✅ Created clients successfully")

    // Create projects
    console.log("Creating projects...")
    const project1 = await prisma.project.upsert({
      where: { projectCode: "HWY-2023-001" },
      update: {},
      create: {
        name: "Highway Extension Phase 2",
        description: "Extension of the main highway by 25km with modern infrastructure",
        location: "North Region",
        startDate: new Date("2023-03-01"),
        endDate: new Date("2024-06-30"),
        budget: 5000000,
        status: "ACTIVE",
        projectCode: "HWY-2023-001",
        clientId: client1.id,
      },
    })

    const project2 = await prisma.project.upsert({
      where: { projectCode: "BRG-2023-001" },
      update: {},
      create: {
        name: "Bridge Reconstruction",
        description: "Complete reconstruction of the old city bridge with enhanced capacity",
        location: "Central City",
        startDate: new Date("2023-05-15"),
        endDate: new Date("2024-02-28"),
        budget: 3500000,
        status: "ACTIVE",
        projectCode: "BRG-2023-001",
        clientId: client2.id,
      },
    })

    console.log("✅ Created projects successfully")

    // Create equipment
    console.log("Creating equipment...")
    const equipment1 = await prisma.equipment.upsert({
      where: { equipmentCode: "EXC-001" },
      update: {},
      create: {
        equipmentCode: "EXC-001",
        name: "Excavator XC-201",
        type: "Excavator",
        make: "Caterpillar",
        model: "CAT 320",
        yearOfManufacture: 2020,
        ownership: "OWNED",
        measurementType: "Hours",
        unit: "Hour",
        size: 20,
        workMeasure: "l/hr",
        acquisitionCost: 250000,
        supplier: "Heavy Equipment Suppliers Ltd",
        dateReceived: new Date("2020-06-15"),
        status: "OPERATIONAL",
      },
    })

    const equipment2 = await prisma.equipment.upsert({
      where: { equipmentCode: "DT-001" },
      update: {},
      create: {
        equipmentCode: "DT-001",
        name: "Dump Truck DT-105",
        type: "Dump Truck",
        make: "Volvo",
        model: "FMX 460",
        yearOfManufacture: 2021,
        ownership: "OWNED",
        measurementType: "Kilometers",
        unit: "Km",
        size: 30,
        workMeasure: "km/l",
        acquisitionCost: 180000,
        supplier: "Volvo Construction Equipment",
        dateReceived: new Date("2021-03-10"),
        status: "OPERATIONAL",
      },
    })

    console.log("✅ Created equipment successfully")

    // Create activities
    console.log("Creating activities...")
    await prisma.activity.create({
      data: {
        name: "Site Clearing and Preparation",
        description: "Clearing vegetation and preparing the construction site",
        projectId: project1.id,
        employeeId: employee1.id,
        startDate: new Date("2023-03-10"),
        endDate: new Date("2023-04-15"),
        status: "COMPLETED",
        totalCost: 25000,
      },
    })

    await prisma.activity.create({
      data: {
        name: "Foundation Excavation",
        description: "Excavating for bridge foundations and abutments",
        projectId: project2.id,
        employeeId: employee2.id,
        startDate: new Date("2023-05-25"),
        endDate: new Date("2023-07-30"),
        status: "IN_PROGRESS",
        totalCost: 45000,
      },
    })

    console.log("✅ Created activities successfully")

    // Create fuel requests
    console.log("Creating fuel requests...")
    await prisma.fuelRequest.upsert({
      where: { requestNumber: "FR-2023-001" },
      update: {},
      create: {
        requestNumber: "FR-2023-001",
        equipmentId: equipment1.id,
        projectId: project1.id,
        fuelType: "DIESEL",
        quantity: 120,
        requestedById: empUser.id,
        justification: "Required for excavation work on Highway Extension Phase 2",
        status: "PENDING",
      },
    })

    await prisma.fuelRequest.upsert({
      where: { requestNumber: "FR-2023-002" },
      update: {},
      create: {
        requestNumber: "FR-2023-002",
        equipmentId: equipment2.id,
        projectId: project2.id,
        fuelType: "DIESEL",
        quantity: 80,
        requestedById: operatorUser.id,
        justification: "Required for material transport on Bridge Reconstruction",
        status: "APPROVED",
        approvedById: pmUser.id,
        approvalDate: new Date(),
      },
    })

    console.log("✅ Created fuel requests successfully")

    console.log("\n🎉 Database seeding completed successfully!")
    console.log("\n🔑 Demo Accounts Created:")
    console.log("┌─────────────────┬─────────────────────────┬──────────────┐")
    console.log("│ Role            │ Email                   │ Password     │")
    console.log("├─────────────────┼─────────────────────────┼──────────────┤")
    console.log("│ Admin           │ admin@example.com       │ password123  │")
    console.log("│ Project Manager │ pm@example.com          │ password123  │")
    console.log("│ Employee        │ john@example.com        │ password123  │")
    console.log("│ Employee        │ michael@example.com     │ password123  │")
    console.log("└─────────────────┴─────────────────────────┴──────────────┘")

    const stats = {
      users: await prisma.user.count(),
      projects: await prisma.project.count(),
      equipment: await prisma.equipment.count(),
      fuelRequests: await prisma.fuelRequest.count(),
      clients: await prisma.client.count(),
      employees: await prisma.employee.count(),
      activities: await prisma.activity.count(),
    }

    console.log("\n📊 Data Summary:")
    console.log(`• ${stats.users} users created`)
    console.log(`• ${stats.projects} projects created`)
    console.log(`• ${stats.equipment} equipment items created`)
    console.log(`• ${stats.fuelRequests} fuel requests created`)
    console.log(`• ${stats.clients} clients created`)
    console.log(`• ${stats.employees} employees created`)
    console.log(`• ${stats.activities} activities created`)
  } catch (error) {
    console.error("❌ Error during seeding:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
