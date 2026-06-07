import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Sale, SaleStatus, PaginatedResponse, SalesSummary } from '@/types'
import { saleStatusLabel, saleStatusColor, formatCurrency } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'

export default function SalesPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('all')
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month')

  const { data: summary } = useQuery({
    queryKey: ['sales-summary', period],
    queryFn: async () => {
      const res = await api.get(`/sales/summary?period=${period}`)
      return res.data.data as SalesSummary
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status !== 'all') params.set('status', status)
      const res = await api.get(`/sales?${params}`)
      return res.data.data as PaginatedResponse<Sale>
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendas</h1>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList>
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="year">Ano</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Receita total</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!summary ? <Skeleton className="h-7 w-28" /> : (
              <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total de pedidos</CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!summary ? <Skeleton className="h-7 w-16" /> : (
              <p className="text-2xl font-bold">{summary.totalOrders}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Ticket médio</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!summary ? <Skeleton className="h-7 w-24" /> : (
              <p className="text-2xl font-bold">{formatCurrency(summary.averageOrderValue)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {summary && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Por status</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(summary.statusBreakdown ?? {}).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm">
                <span className="text-muted-foreground">{saleStatusLabel(k as SaleStatus)}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Select value={status} onValueChange={(v) => v !== null && setStatus(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as SaleStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{saleStatusLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm text-muted-foreground">{data?.meta.total ?? 0} vendas</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {data?.data?.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{s.product?.title ?? 'Produto'}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.orderId} · {s.customerName ?? 'Cliente'} · {format(new Date(s.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={saleStatusColor(s.status)}>{saleStatusLabel(s.status)}</Badge>
                    <span className="text-sm font-bold">{formatCurrency(s.value)}</span>
                  </div>
                </div>
              ))}
              {data?.data?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda encontrada.</p>
              )}
            </div>
          )}

          {data && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={!data.meta.hasPrev} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <span className="flex items-center text-sm text-muted-foreground">{page} / {data.meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={!data.meta.hasNext} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
