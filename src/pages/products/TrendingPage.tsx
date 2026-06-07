import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import type { Product } from '@/types'
import { trendLabel, formatCurrency } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Flame, Eye } from 'lucide-react'

export default function TrendingPage() {
  const { data: trending, isLoading: loadTrending } = useQuery({
    queryKey: ['products-trending'],
    queryFn: async () => {
      const res = await api.get('/products/trending')
      return res.data.data as Product[]
    },
  })

  const { data: viral, isLoading: loadViral } = useQuery({
    queryKey: ['trends-viral'],
    queryFn: async () => {
      const res = await api.get('/trends/viral')
      return res.data.data as Array<{
        id: string; title: string; trendScore: number; category: string; price: number; salesCount: number; rating: number
      }>
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Flame className="w-6 h-6 text-red-500" /> Produtos em Alta
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trending (Score ≥ 70)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadTrending ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (
              <div className="space-y-2">
                {trending?.map((p) => {
                  const trend = trendLabel(p.trendScore)
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.category} · {formatCurrency(p.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className={`text-xs font-bold ${trend.color}`}>{p.trendScore}</span>
                        <Link to={`/products/${p.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
                          <Eye className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
                {trending?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto trending.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" /> Virais (Score ≥ 90)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadViral ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : (
              <div className="space-y-3">
                {viral?.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg border bg-red-50/50 dark:bg-red-900/10">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.category}</p>
                      </div>
                      <Badge className="bg-red-500 text-white shrink-0">{p.trendScore}</Badge>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{formatCurrency(p.price)}</span>
                      <span>{p.salesCount} vendas</span>
                      <span>⭐ {p.rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
                {viral?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto viral.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
