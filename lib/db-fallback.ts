// Mock data for fallback when database is unavailable
export const mockData = {
  projects: [
    {
      id: 1,
      name: "Sample Construction Project",
      projectCode: "PRJ-0001",
      description: "A sample project for demonstration",
      location: "Sample Location",
      budget: 100000,
      status: "ACTIVE",
      startDate: new Date(),
      endDate: null,
      clientId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 1,
    },
  ],
  clients: [
    {
      id: 1,
      name: "Sample Client",
      email: "client@example.com",
      phone: "+1234567890",
      address: "123 Sample Street",
      contactName: "John Doe",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  equipment: [
    {
      id: 1,
      name: "Sample Excavator",
      equipmentCode: "EQ-0001",
      type: "EXCAVATOR",
      status: "OPERATIONAL",
      purchaseDate: new Date(),
      purchasePrice: 50000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  employees: [
    {
      id: 1,
      firstName: "John",
      lastName: "Worker",
      email: "worker@example.com",
      phone: "+1234567890",
      position: "Operator",
      hireDate: new Date(),
      salary: 50000,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  activities: [
    {
      id: 1,
      name: "Sample Activity",
      description: "A sample activity",
      status: "IN_PROGRESS",
      startDate: new Date(),
      endDate: null,
      projectId: 1,
      employeeId: 1,
      quantity: 1,
      unitCost: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  fuelRequests: [
    {
      id: 1,
      requestNumber: "FR-0001",
      equipmentId: 1,
      projectId: 1,
      fuelType: "DIESEL",
      quantity: 100,
      status: "PENDING",
      requestDate: new Date(),
      requestedById: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
}

// Fallback database operations
export class FallbackDatabase {
  static async count(table: keyof typeof mockData): Promise<number> {
    return mockData[table].length
  }

  static async findMany(table: keyof typeof mockData, options?: any): Promise<any[]> {
    const data = mockData[table]
    if (options?.take) {
      return data.slice(0, options.take)
    }
    return data
  }

  static async groupBy(table: keyof typeof mockData, field: string): Promise<any[]> {
    const data = mockData[table]
    const groups: { [key: string]: number } = {}

    data.forEach((item: any) => {
      const value = item[field] || "UNKNOWN"
      groups[value] = (groups[value] || 0) + 1
    })

    return Object.entries(groups).map(([status, count]) => ({
      [field]: status,
      _count: { [field]: count },
    }))
  }

  static async findUnique(table: keyof typeof mockData, id: number): Promise<any | null> {
    const data = mockData[table]
    return data.find((item: any) => item.id === id) || null
  }
}
