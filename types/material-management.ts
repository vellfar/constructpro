import type {
  Material,
  MaterialRequest,
  MaterialInventory,
  MaterialTransaction,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  LocationType,
  MaterialUrgency,
  MaterialRequestStatus,
  TransactionType,
  PurchaseOrderStatus,
} from "@prisma/client"

// Enhanced Material Types
export interface MaterialWithRelations extends Material {
  supplier?: Supplier | null
  inventory?: MaterialInventory[]
  requests?: MaterialRequestWithRelations[]
  transactions?: MaterialTransactionWithRelations[]
  _count?: {
    inventory: number
    requests: number
    transactions: number
  }
}

export interface CreateMaterialRequest {
  materialCode: string
  name: string
  description?: string
  category: string
  unit: string
  unitCost?: number
  minimumStockLevel?: number
  maximumStockLevel?: number
  reorderPoint?: number
  supplierId?: number
}

export interface UpdateMaterialRequest extends Partial<CreateMaterialRequest> {
  isActive?: boolean
}

// Material Request Types
export interface MaterialRequestWithRelations extends MaterialRequest {
  material: {
    id: number
    name: string
    materialCode: string
    category: string
    unit: string
    unitCost?: number | null
  }
  project: {
    id: number
    name: string
    projectCode?: string | null
    location?: string | null
  }
  requestedBy: {
    id: number
    firstName: string
    lastName: string
    employee?: {
      employeeNumber: string
      designation: string
    } | null
  }
  approvedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
  issuedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
  acknowledgedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
  completedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
}

export interface CreateMaterialRequestRequest {
  materialId: number
  projectId: number
  requestedQuantity: number
  justification: string
  urgency: MaterialUrgency
  deliveryLocation: LocationType
  requiredDate?: string
}

export interface ApproveMaterialRequestRequest {
  approved: boolean
  approvedQuantity?: number
  approvalComments?: string
  rejectionReason?: string
}

export interface IssueMaterialRequestRequest {
  issuedQuantity: number
  issuanceComments?: string
}

export interface AcknowledgeMaterialRequestRequest {
  acknowledgedQuantity: number
  acknowledgmentComments?: string
}

export interface CompleteMaterialRequestRequest {
  completionComments?: string
}

// Supplier Types
export interface SupplierWithRelations extends Supplier {
  materials?: Material[]
  purchaseOrders?: PurchaseOrder[]
  _count?: {
    materials: number
    purchaseOrders: number
  }
}

export interface CreateSupplierRequest {
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  taxNumber?: string
  paymentTerms?: string
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  isActive?: boolean
}

// Inventory Types
export interface MaterialInventoryWithRelations extends MaterialInventory {
  material: {
    id: number
    name: string
    materialCode: string
    category: string
    unit: string
    minimumStockLevel?: number | null
    maximumStockLevel?: number | null
  }
  project?: {
    id: number
    name: string
    projectCode?: string | null
  } | null
}

export interface InventoryAdjustmentRequest {
  materialId: number
  locationType: LocationType
  locationReference?: string
  projectId?: number
  adjustmentQuantity: number
  adjustmentType: 'INCREASE' | 'DECREASE'
  reason: string
}

// Transaction Types
export interface MaterialTransactionWithRelations extends MaterialTransaction {
  material: {
    id: number
    name: string
    materialCode: string
    unit: string
  }
  performedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
}

export interface CreateTransactionRequest {
  materialId: number
  transactionType: TransactionType
  referenceType?: string
  referenceId?: number
  fromLocationType?: LocationType
  fromLocationReference?: string
  fromProjectId?: number
  toLocationType?: LocationType
  toLocationReference?: string
  toProjectId?: number
  quantity: number
  unitCost?: number
  notes?: string
}

// Purchase Order Types
export interface PurchaseOrderWithRelations extends PurchaseOrder {
  supplier: {
    id: number
    name: string
    contactPerson?: string | null
    email?: string | null
    phone?: string | null
  }
  project?: {
    id: number
    name: string
    projectCode?: string | null
  } | null
  items: Array<{
    id: number
    material: {
      id: number
      name: string
      materialCode: string
      unit: string
    }
    quantity: number
    unitCost: number
    totalCost: number
    receivedQuantity: number
  }>
  createdBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
  approvedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
  receivedBy?: {
    id: number
    firstName: string
    lastName: string
  } | null
}

export interface CreatePurchaseOrderRequest {
  supplierId: number
  projectId?: number
  expectedDeliveryDate?: string
  deliveryLocation: LocationType
  deliveryAddress?: string
  termsAndConditions?: string
  items: Array<{
    materialId: number
    quantity: number
    unitCost: number
  }>
}

export interface UpdatePurchaseOrderRequest extends Partial<CreatePurchaseOrderRequest> {
  status?: PurchaseOrderStatus
  actualDeliveryDate?: string
  notes?: string
}

export interface ReceivePurchaseOrderRequest {
  items: Array<{
    itemId: number
    receivedQuantity: number
  }>
  actualDeliveryDate?: string
  notes?: string
}

// Dashboard and Analytics Types
export interface MaterialDashboardStats {
  totalMaterials: number
  activeMaterials: number
  totalSuppliers: number
  activeSuppliers: number
  pendingRequests: number
  lowStockItems: number
  totalInventoryValue: number
  requestsByStatus: Array<{
    status: MaterialRequestStatus
    count: number
  }>
  topRequestedMaterials: Array<{
    materialId: number
    materialName: string
    materialCode: string
    requestCount: number
    totalQuantity: number
  }>
  inventoryByLocation: Array<{
    locationType: LocationType
    locationReference?: string
    totalItems: number
    totalValue: number
  }>
  recentTransactions: Array<{
    id: number
    materialName: string
    transactionType: TransactionType
    quantity: number
    transactionDate: Date
    performedBy?: string
  }>
}

// Search and Filter Types
export interface MaterialSearchFilters {
  query?: string
  category?: string | string[]
  supplierId?: number
  isActive?: boolean
  lowStock?: boolean
  minUnitCost?: number
  maxUnitCost?: number
}

export interface MaterialRequestSearchFilters {
  query?: string
  status?: MaterialRequestStatus | MaterialRequestStatus[]
  materialId?: number
  projectId?: number
  requestedById?: number
  urgency?: MaterialUrgency | MaterialUrgency[]
  deliveryLocation?: LocationType
  dateFrom?: string
  dateTo?: string
}

export interface InventorySearchFilters {
  query?: string
  materialId?: number
  locationType?: LocationType
  locationReference?: string
  projectId?: number
  lowStock?: boolean
  zeroStock?: boolean
}

export interface TransactionSearchFilters {
  query?: string
  materialId?: number
  transactionType?: TransactionType | TransactionType[]
  dateFrom?: string
  dateTo?: string
  performedById?: number
}

// Report Types
export interface MaterialReportParams {
  reportType: 'inventory' | 'requests' | 'transactions' | 'suppliers' | 'usage'
  dateFrom?: string
  dateTo?: string
  materialIds?: number[]
  projectIds?: number[]
  supplierIds?: number[]
  locationTypes?: LocationType[]
  format: 'pdf' | 'excel' | 'csv'
}

// Validation Types
export interface MaterialValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    code: string
  }>
}

// Export utility types
export type MaterialEntityType = "material" | "materialRequest" | "supplier" | "purchaseOrder" | "inventory"
export type MaterialActionType = "create" | "update" | "delete" | "approve" | "reject" | "issue" | "acknowledge" | "complete"
