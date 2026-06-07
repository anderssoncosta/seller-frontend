import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Brain, DollarSign, BarChart2, Plus, Trash2 } from 'lucide-react'

function AnalyzeProduct() {
  const [result, setResult] = useState<any>(null)
  const { register, handleSubmit } = useForm({
    defaultValues: { title: '', category: '', price: '', rating: '', reviews: '', salesCount: '', trendScore: '' },
  })
  const { mutate, isPending } = useMutation({
    mutationFn: (d: any) => api.post('/ai/analyze-product', {
      ...d, price: +d.price, rating: +d.rating, reviews: +d.reviews, salesCount: +d.salesCount, trendScore: +d.trendScore,
    }),
    onSuccess: ({ data }) => setResult(data.data.analysis),
    onError: () => toast.error('Erro na análise'),
  })

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit((d) => mutate(d))} className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1"><Label>Título</Label><Input placeholder="Nome do produto" {...register('title', { required: true })} /></div>
        <div className="space-y-1"><Label>Categoria</Label><Input placeholder="Eletrônicos" {...register('category', { required: true })} /></div>
        <div className="space-y-1"><Label>Preço</Label><Input type="number" step="0.01" placeholder="299.90" {...register('price', { required: true })} /></div>
        <div className="space-y-1"><Label>Avaliação (0-5)</Label><Input type="number" step="0.1" placeholder="4.5" {...register('rating')} /></div>
        <div className="space-y-1"><Label>Reviews</Label><Input type="number" placeholder="230" {...register('reviews')} /></div>
        <div className="space-y-1"><Label>Vendas totais</Label><Input type="number" placeholder="1800" {...register('salesCount')} /></div>
        <div className="space-y-1"><Label>Trend Score</Label><Input type="number" placeholder="85" {...register('trendScore')} /></div>
        <div className="col-span-2">
          <Button type="submit" className="w-full" disabled={isPending}>{isPending ? 'Analisando...' : 'Analisar produto'}</Button>
        </div>
      </form>
      {result && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{result.overallScore}</span>
              <span className="text-sm text-muted-foreground capitalize">{result.sentiment} · {result.marketPosition}</span>
            </div>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { k: 'strengths', label: 'Pontos fortes', color: 'text-green-600' },
                { k: 'weaknesses', label: 'Pontos fracos', color: 'text-red-500' },
                { k: 'opportunities', label: 'Oportunidades', color: 'text-blue-500' },
                { k: 'recommendations', label: 'Recomendações', color: 'text-purple-500' },
              ].map(({ k, label, color }) => (
                <div key={k}>
                  <p className={`text-xs font-semibold uppercase mb-1 ${color}`}>{label}</p>
                  <ul className="space-y-1">{(result[k] as string[]).map((item, i) => <li key={i} className="text-sm text-muted-foreground">• {item}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SuggestPrice() {
  const [result, setResult] = useState<any>(null)
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      title: '', category: '', currentPrice: '', costPrice: '',
      competitors: [{ sellerName: '', price: '', rating: '' }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'competitors' })

  const { mutate, isPending } = useMutation({
    mutationFn: (d: any) => api.post('/ai/suggest-price', {
      title: d.title, category: d.category,
      currentPrice: +d.currentPrice, costPrice: +d.costPrice,
      competitors: d.competitors.map((c: any) => ({ ...c, price: +c.price, rating: +c.rating })),
    }),
    onSuccess: ({ data }) => setResult(data.data.suggestion),
    onError: () => toast.error('Erro ao sugerir preço'),
  })

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1"><Label>Título</Label><Input {...register('title', { required: true })} /></div>
          <div className="space-y-1"><Label>Categoria</Label><Input {...register('category', { required: true })} /></div>
          <div className="space-y-1"><Label>Preço atual</Label><Input type="number" step="0.01" {...register('currentPrice', { required: true })} /></div>
          <div className="space-y-1"><Label>Preço de custo</Label><Input type="number" step="0.01" {...register('costPrice')} /></div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Concorrentes</Label>
            <Button type="button" variant="ghost" size="sm" onClick={() => append({ sellerName: '', price: '', rating: '' })}>
              <Plus className="w-3 h-3 mr-1" />Adicionar
            </Button>
          </div>
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-3 gap-2 mb-2">
              <Input placeholder="Nome da loja" {...register(`competitors.${i}.sellerName`)} />
              <Input type="number" step="0.01" placeholder="Preço" {...register(`competitors.${i}.price`)} />
              <div className="flex gap-1">
                <Input type="number" step="0.1" placeholder="Rating" {...register(`competitors.${i}.rating`)} />
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>{isPending ? 'Calculando...' : 'Sugerir preço'}</Button>
      </form>

      {result && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="text-center"><p className="text-xs text-muted-foreground">Mínimo</p><p className="text-lg font-bold">R$ {result.minPrice.toFixed(2)}</p></div>
              <div className="text-center border-x px-4"><p className="text-xs text-muted-foreground">Recomendado</p><p className="text-2xl font-bold text-primary">R$ {result.suggestedPrice.toFixed(2)}</p></div>
              <div className="text-center"><p className="text-xs text-muted-foreground">Máximo</p><p className="text-lg font-bold">R$ {result.maxPrice.toFixed(2)}</p></div>
            </div>
            <p className="text-sm text-muted-foreground">{result.rationale}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Volume: <b>{result.expectedImpact.salesVolume}</b></span>
              <span>Margem: <b>{result.expectedImpact.profitMargin}</b></span>
              <span>Posição: <b>{result.expectedImpact.marketPosition}</b></span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MarketInsights() {
  const [result, setResult] = useState<any>(null)
  const { register, handleSubmit } = useForm({ defaultValues: { category: '', market: 'Brazil', question: '' } })

  const { mutate, isPending } = useMutation({
    mutationFn: (d: any) => api.post('/ai/market-insights', d),
    onSuccess: ({ data }) => setResult(data.data.insights),
    onError: () => toast.error('Erro ao buscar insights'),
  })

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-3">
        <div className="space-y-1"><Label>Categoria</Label><Input placeholder="Calçados Esportivos" {...register('category', { required: true })} /></div>
        <div className="space-y-1"><Label>Mercado</Label><Input placeholder="Brazil" {...register('market')} /></div>
        <div className="space-y-1"><Label>Pergunta (opcional)</Label><Input placeholder="Qual a melhor época para lançar?" {...register('question')} /></div>
        <Button type="submit" className="w-full" disabled={isPending}>{isPending ? 'Buscando...' : 'Buscar insights'}</Button>
      </form>

      {result && (
        <>
          <Separator />
          <div className="space-y-4">
            <p className="text-sm">{result.marketOverview}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-blue-500 mb-1">Tendências</p>
                {(result.trends as any[]).map((t: any, i: number) => (
                  <p key={i} className="text-sm text-muted-foreground">• {t.trend} — {t.impact}</p>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-green-500 mb-1">Oportunidades</p>
                {(result.topOpportunities as string[]).map((o, i) => (
                  <p key={i} className="text-sm text-muted-foreground">• {o}</p>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-red-500 mb-1">Riscos</p>
                {(result.risks as string[]).map((r, i) => (
                  <p key={i} className="text-sm text-muted-foreground">• {r}</p>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-purple-500 mb-1">Fatores de sucesso</p>
                {(result.keySuccessFactors as string[]).map((k, i) => (
                  <p key={i} className="text-sm text-muted-foreground">• {k}</p>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground"><b>Sazonalidade:</b> {result.seasonality}</p>
            <p className="text-sm text-muted-foreground"><b>Concorrência:</b> {result.competitionLevel} · <b>Outlook:</b> {result.growthOutlook}</p>
          </div>
        </>
      )}
    </div>
  )
}

export default function AIPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Brain className="w-6 h-6" /> Ferramentas de IA
      </h1>
      <Tabs defaultValue="analyze">
        <TabsList className="w-full">
          <TabsTrigger value="analyze" className="flex-1 gap-2"><Brain className="w-4 h-4" />Analisar produto</TabsTrigger>
          <TabsTrigger value="price" className="flex-1 gap-2"><DollarSign className="w-4 h-4" />Sugerir preço</TabsTrigger>
          <TabsTrigger value="insights" className="flex-1 gap-2"><BarChart2 className="w-4 h-4" />Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="analyze">
          <Card><CardHeader><CardTitle className="text-base">Análise de produto</CardTitle></CardHeader><CardContent><AnalyzeProduct /></CardContent></Card>
        </TabsContent>
        <TabsContent value="price">
          <Card><CardHeader><CardTitle className="text-base">Sugestão de preço</CardTitle></CardHeader><CardContent><SuggestPrice /></CardContent></Card>
        </TabsContent>
        <TabsContent value="insights">
          <Card><CardHeader><CardTitle className="text-base">Insights de mercado</CardTitle></CardHeader><CardContent><MarketInsights /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
