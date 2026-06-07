export type Role = 'ADMIN' | 'MEMBER'
export type OrganizationPlan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'
export type ProductStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'UNDER_REVIEW'
export type SaleStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
export type NotificationType = 'NEW_SALE' | 'VIRAL_PRODUCT' | 'COMPETITOR_PRICE_CHANGE' | 'MARKETPLACE_DISCONNECTED'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  organizationId: string | null
  createdAt: string
  updatedAt: string
}

export interface Organization {
  id: string
  name: string
  plan: OrganizationPlan
  status: OrganizationStatus
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  mlId: string
  title: string
  category: string
  price: number
  salesCount: number
  reviews: number
  rating: number
  score: number
  trendScore: number
  status: ProductStatus
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface Competitor {
  id: string
  sellerId: string
  sellerName: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: string
  orderId: string
  value: number
  productId: string
  customerId: string | null
  customerName: string | null
  status: SaleStatus
  createdAt: string
  updatedAt: string
  product?: { title: string; mlId: string }
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  statusCode: number
  timestamp: string
}

export interface DashboardKPIs {
  revenueToday: number
  revenueTodayOrders: number
  revenueMonth: number
  revenueMonthOrders: number
  profit: number
  viralProducts: number
  monitoredProducts: number
  monitoredCompetitors: number
  recentSales: Array<{
    id: string
    orderId: string
    value: number
    status: SaleStatus
    createdAt: string
    product: { title: string; mlId: string }
  }>
}

export interface ChartData {
  period: string
  chartData: Array<{ date: string; revenue: number; orders: number }>
}

export interface TrendChartData {
  topProducts: Array<{ id: string; title: string; trendScore: number; category: string }>
  distribution: Array<{ label: string; min: number; max: number; count: number }>
}

export interface SalesSummary {
  period: string
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  statusBreakdown: Record<string, number>
}
