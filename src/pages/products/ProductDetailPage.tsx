import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { Product } from '@/types'
import { trendLabel, productStatusLabel, formatCurrency } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Brain, Star, ShoppingCart, BarChart2 } from 'lucide-react'
import { useState } from 'react'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<any>(null)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`)
      return res.data.data as Product
    },
  })

  const { data: trendDetail } = useQuery({
    queryKey: ['trend-detail', id],
    queryFn: async () => {
      const res = await api.get(`/trends/${id}`)
      return res.data.data
    },
    enabled: !!product,
  })

  const analyzeMutation = useMutation({
    mutationFn: () => api.post('/ai/analyze-product', {
      title: product!.title,
      category: product!.category,
      price: product!.price,
      rating: product!.rating,
      reviews: product!.reviews,
      salesCount: product!.salesCount,
      trendScore: product!.trendScore,
    }),
    onSuccess: ({ data }) => setAnalysis(data.data.analysis),
    onError: () => toast.error('Erro na análise de IA'),
  })

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  if (!product) return <p className="text-muted-foreground">Produto não encontrado.</p>

  const trend = trendLabel(product.trendScore)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold truncate">{product.title}</h1>
        <Badge variant="outline">{productStatusLabel(product.status)}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Preço', value: formatCurrency(product.price), icon: ShoppingCart },
          { label: 'Vendas', value: product.salesCount, icon: BarChart2 },
          { label: 'Avaliação', value: `${product.rating.toFixed(1)} ⭐ (${product.reviews})`, icon: Star },
          { label: 'Trend Score', value: `${product.trendScore} — ${trend.label}`, icon: BarChart2 },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
              <Icon className="w-3 h-3 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {trendDetail && (
        <Card>
          <CardHeader><CardTitle className="text-base">Breakdown de Trend</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(trendDetail.trendBreakdown ?? {}).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-medium">{val as number}</span>
                </div>
                <Progress value={val as number} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4" /> Análise de IA
          </CardTitle>
          <Button size="sm" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
            {analyzeMutation.isPending ? 'Analisando...' : 'Analisar'}
          </Button>
        </CardHeader>
        <CardContent>
          {!analysis ? (
            <p className="text-sm text-muted-foreground">Clique em "Analisar" para obter insights sobre este produto.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold">{analysis.overallScore}</div>
                <Badge variant={analysis.sentiment === 'positive' ? 'default' : 'secondary'}>
                  {analysis.sentiment}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Pontos fortes', items: analysis.strengths, color: 'text-green-600' },
                  { label: 'Pontos fracos', items: analysis.weaknesses, color: 'text-red-500' },
                  { label: 'Oportunidades', items: analysis.opportunities, color: 'text-blue-500' },
                  { label: 'Recomendações', items: analysis.recommendations, color: 'text-purple-500' },
                ].map(({ label, items, color }) => (
                  <div key={label}>
                    <p className={`text-xs font-semibold uppercase mb-1 ${color}`}>{label}</p>
                    <ul className="space-y-1">
                      {(items as string[]).map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
