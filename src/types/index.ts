// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface ActionItem {
  id: string;
  type: 'po_approval' | 'invoice_due' | 'reorder_alert' | 'price_change' | 'receiving';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  link: string;
  createdAt: Date;
}

export interface DashboardStats {
  openPOCount: number;
  openPOValue: number;
  unpaidInvoiceCount: number;
  unpaidInvoiceValue: number;
  invoicesDueThisWeek: number;
  activeVendorCount: number;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface VendorFilters {
  search?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface POFilters {
  search?: string;
  status?: string;
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InvoiceFilters {
  search?: string;
  status?: string;
  vendorId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InventoryFilters {
  search?: string;
  vendorId?: string;
  belowReorderPoint?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Reorder Alert Type
// ============================================================================

export interface ReorderAlert {
  productId: string;
  productName: string;
  ourSku: string;
  vendorName: string;
  vendorId: string;
  currentStock: number;
  reorderPoint: number;
  salesVelocity: number;
  daysRemaining: number;
  suggestedQty: number;
  lastOrdered: Date | null;
}
