import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { Product, ProductStatus, PaginatedResponse } from '@/types'
import { productStatusLabel, trendLabel, formatCurrency } from '@/lib/formatters'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'

export default function ProductsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm<{ mlId: string; title: string; category: string; price: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status !== 'all') params.set('status', status)
      const res = await api.get(`/products?${params}`)
      return res.data.data as PaginatedResponse<Product>
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { toast.success('Produto removido'); qc.invalidateQueries({ queryKey: ['products'] }) },
    onError: () => toast.error('Erro ao remover produto'),
  })

  const addMutation = useMutation({
    mutationFn: (d: { mlId: string; title: string; category: string; price: number }) =>
      api.post('/products', d),
    onSuccess: () => {
      toast.success('Produto adicionado!')
      qc.invalidateQueries({ queryKey: ['products'] })
      setAddOpen(false)
      reset()
    },
    onError: () => toast.error('Erro ao adicionar produto'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button size="sm"><Plus className="w-4 h-4 mr-2" />Adicionar</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar produto</DialogTitle></DialogHeader>
            <form
              onSubmit={handleSubmit((d) => addMutation.mutate({ ...d, price: parseFloat(d.price) }))}
              className="space-y-4"
            >
              <div className="space-y-1">
                <Label>ID ML (ex: MLB123)</Label>
                <Input placeholder="MLB123456789" {...register('mlId', { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>Título</Label>
                <Input placeholder="Nome do produto" {...register('title', { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Input placeholder="Eletrônicos" {...register('category', { required: true })} />
              </div>
              <div className="space-y-1">
                <Label>Preço</Label>
                <Input type="number" step="0.01" placeholder="299.90" {...register('price', { required: true })} />
              </div>
              <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Buscar..." className="max-w-xs" />
        <Select value={status} onValueChange={(v) => v !== null && setStatus(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="PAUSED">Pausado</SelectItem>
            <SelectItem value="CLOSED">Encerrado</SelectItem>
            <SelectItem value="UNDER_REVIEW">Em revisão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm text-muted-foreground">{data?.meta.total ?? 0} produtos</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {data?.data?.map((p) => {
                const trend = trendLabel(p.trendScore)
                return (
                  <div key={p.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <Badge variant="outline" className="shrink-0 text-xs">{productStatusLabel(p.status as ProductStatus)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.mlId} · {p.category}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold">{formatCurrency(p.price)}</p>
                        <p className={`text-xs font-medium ${trend.color}`}>Trend: {p.trendScore} ({trend.label})</p>
                      </div>
                      <div className="flex gap-1">
                        <Link to={`/products/${p.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => { if (confirm('Remover produto?')) deleteMutation.mutate(p.id) }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {data && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={!data.meta.hasPrev} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {page} / {data.meta.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={!data.meta.hasNext} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
