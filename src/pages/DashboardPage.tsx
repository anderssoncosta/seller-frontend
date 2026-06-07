import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { DashboardKPIs, ChartData, TrendChartData } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { DollarSign, ShoppingCart, TrendingUp, Package, Users, Flame } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { saleStatusLabel, saleStatusColor } from '@/lib/formatters'

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']

function KPICard({ title, value, sub, icon: Icon, loading }: {
  title: string; value: string; sub?: string; icon: React.ElementType; loading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  const { data: kpis, isLoading: loadKpis } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const res = await api.get('/dashboard/kpis')
      return res.data.data as DashboardKPIs
    },
  })

  const { data: chart, isLoading: loadChart } = useQuery({
    queryKey: ['dashboard-chart', period],
    queryFn: async () => {
      const res = await api.get(`/dashboard/chart/sales?period=${period}`)
      return res.data.data as ChartData
    },
  })

  const { data: trends } = useQuery({
    queryKey: ['dashboard-trends'],
    queryFn: async () => {
      const res = await api.get('/dashboard/chart/trends')
      return res.data.data as TrendChartData
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Receita hoje" value={`R$ ${(kpis?.revenueToday ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} sub={`${kpis?.revenueTodayOrders ?? 0} pedidos`} icon={DollarSign} loading={loadKpis} />
        <KPICard title="Receita mês" value={`R$ ${(kpis?.revenueMonth ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} sub={`${kpis?.revenueMonthOrders ?? 0} pedidos`} icon={ShoppingCart} loading={loadKpis} />
        <KPICard title="Lucro est." value={`R$ ${(kpis?.profit ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} loading={loadKpis} />
        <KPICard title="Virais" value={String(kpis?.viralProducts ?? 0)} icon={Flame} loading={loadKpis} />
        <KPICard title="Produtos" value={String(kpis?.monitoredProducts ?? 0)} icon={Package} loading={loadKpis} />
        <KPICard title="Concorrentes" value={String(kpis?.monitoredCompetitors ?? 0)} icon={Users} loading={loadKpis} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Receita</CardTitle>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <TabsList className="h-8">
                <TabsTrigger value="week" className="text-xs">Semana</TabsTrigger>
                <TabsTrigger value="month" className="text-xs">Mês</TabsTrigger>
                <TabsTrigger value="year" className="text-xs">Ano</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {loadChart ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chart?.chartData}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Trend distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {!trends ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={trends.distribution} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
                    {trends.distribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent sales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Vendas recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadKpis ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {kpis?.recentSales?.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{s.product.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.orderId} · {format(new Date(s.createdAt), 'dd MMM HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={saleStatusColor(s.status)}>{saleStatusLabel(s.status)}</Badge>
                    <span className="text-sm font-semibold">R$ {s.value.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
