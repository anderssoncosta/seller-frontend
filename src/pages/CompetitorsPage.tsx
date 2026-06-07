import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { Competitor } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency } from '@/lib/formatters'

function CompetitorProducts({ competitorId }: { competitorId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['competitor-products', competitorId],
    queryFn: async () => {
      const res = await api.get(`/competitors/${competitorId}/products`)
      const d = res.data.data
      return (Array.isArray(d) ? d : d?.products ?? []) as Array<{ title: string; price: number; mlId: string }>
    },
  })

  if (isLoading) return <Skeleton className="h-32 w-full mt-2" />
  return (
    <div className="mt-3 space-y-2">
      {data?.slice(0, 5).map((p, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
          <p className="text-sm truncate flex-1">{p.title}</p>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-sm font-medium">{formatCurrency(p.price)}</span>
            <a href={`https://www.mercadolivre.com.br/anuncio/${p.mlId}`} target="_blank" rel="noreferrer">
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          </div>
        </div>
      ))}
      {(!data || data.length === 0) && <p className="text-xs text-muted-foreground">Nenhum anúncio encontrado.</p>}
    </div>
  )
}

export default function CompetitorsPage() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const { register, handleSubmit, reset } = useForm<{ sellerName: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['competitors'],
    queryFn: async () => {
      const res = await api.get('/competitors')
      return res.data.data as Competitor[]
    },
  })

  const addMutation = useMutation({
    mutationFn: (d: { sellerName: string }) => api.post('/competitors', d),
    onSuccess: () => {
      toast.success('Concorrente adicionado!')
      qc.invalidateQueries({ queryKey: ['competitors'] })
      setAddOpen(false)
      reset()
    },
    onError: (err: any) => {
      if (err.response?.status === 409) toast.error('Concorrente já monitorado')
      else toast.error('Erro ao adicionar concorrente')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/competitors/${id}`),
    onSuccess: () => { toast.success('Concorrente removido'); qc.invalidateQueries({ queryKey: ['competitors'] }) },
    onError: () => toast.error('Erro ao remover concorrente'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Concorrentes</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button size="sm"><Plus className="w-4 h-4 mr-2" />Adicionar</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Monitorar concorrente</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="space-y-4">
              <div className="space-y-1">
                <Label>Nome da loja (nickname no ML)</Label>
                <Input placeholder="pontuale" {...register('sellerName', { required: true })} />
              </div>
              <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Adicionando...' : 'Monitorar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm text-muted-foreground">{data?.length ?? 0} concorrentes monitorados</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {data?.map((c) => (
                <div key={c.id} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-semibold">{c.sellerName}</p>
                      <p className="text-xs text-muted-foreground">
                        Seller ID: {c.sellerId} · Desde {format(new Date(c.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">ML Seller</Badge>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      >
                        {expanded === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => { if (confirm('Remover concorrente?')) deleteMutation.mutate(c.id) }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {expanded === c.id && (
                    <div className="px-3 pb-3 border-t bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground pt-2 mb-1">Anúncios ativos</p>
                      <CompetitorProducts competitorId={c.id} />
                    </div>
                  )}
                </div>
              ))}
              {data?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Nenhum concorrente monitorado. Adicione um para começar.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
