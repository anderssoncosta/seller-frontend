import type { SaleStatus, ProductStatus } from '@/types'

export function saleStatusLabel(s: SaleStatus): string {
  const map: Record<SaleStatus, string> = {
    PENDING: 'Pendente', PAID: 'Pago', SHIPPED: 'Enviado',
    DELIVERED: 'Entregue', CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
  }
  return map[s] ?? s
}

export function saleStatusColor(s: SaleStatus): string {
  const map: Record<SaleStatus, string> = {
    PENDING: 'text-yellow-600 border-yellow-300',
    PAID: 'text-green-600 border-green-300',
    SHIPPED: 'text-blue-600 border-blue-300',
    DELIVERED: 'text-emerald-600 border-emerald-300',
    CANCELLED: 'text-red-600 border-red-300',
    REFUNDED: 'text-orange-600 border-orange-300',
  }
  return map[s] ?? ''
}

export function productStatusLabel(s: ProductStatus): string {
  const map: Record<ProductStatus, string> = {
    ACTIVE: 'Ativo', PAUSED: 'Pausado', CLOSED: 'Encerrado', UNDER_REVIEW: 'Em revisão',
  }
  return map[s] ?? s
}

export function trendLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Viral', color: 'text-red-500' }
  if (score >= 70) return { label: 'Bom', color: 'text-green-500' }
  if (score >= 50) return { label: 'Médio', color: 'text-yellow-500' }
  return { label: 'Ruim', color: 'text-muted-foreground' }
}

export function formatCurrency(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return 'R$ 0,00'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
