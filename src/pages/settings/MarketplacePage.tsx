import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Store, ExternalLink, Unlink } from 'lucide-react'

export default function MarketplacePage() {
  const qc = useQueryClient()

  const { data: authUrl, isLoading: loadingUrl } = useQuery({
    queryKey: ['ml-auth-url'],
    queryFn: async () => {
      const res = await api.get('/mercadolivre/auth')
      return res.data.data.authUrl as string
    },
  })

  const { data: status, isLoading: loadingStatus } = useQuery({
    queryKey: ['ml-status'],
    queryFn: async () => {
      const res = await api.get('/mercadolivre/status')
      return res.data.data as { connected: boolean; sellerId?: string; sellerNickname?: string }
    },
  })

  const { data: listings } = useQuery({
    queryKey: ['ml-listings'],
    queryFn: async () => {
      const res = await api.get('/mercadolivre/listings')
      return res.data.data.listings as Array<{ title: string; price: number; mlId: string; status: string }>
    },
    enabled: status?.connected === true,
    retry: false,
  })

  const disconnectMutation = useMutation({
    mutationFn: () => api.post('/mercadolivre/disconnect'),
    onSuccess: () => {
      toast.success('Mercado Livre desconectado')
      qc.invalidateQueries({ queryKey: ['ml-status'] })
      qc.invalidateQueries({ queryKey: ['ml-listings'] })
    },
    onError: () => toast.error('Erro ao desconectar'),
  })

  const isConnected = status?.connected === true

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Store className="w-6 h-6" /> Mercado Livre
      </h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Conexão</CardTitle>
            {loadingStatus ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </Badge>
            )}
          </div>
          <CardDescription>
            {isConnected && status?.sellerNickname
              ? `Conta: ${status.sellerNickname}`
              : 'Conecte sua conta do Mercado Livre para sincronizar produtos e vendas.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          {loadingUrl ? (
            <Skeleton className="h-9 w-40" />
          ) : (
            <Button onClick={() => { if (authUrl) window.location.href = authUrl }}>
              <ExternalLink className="w-4 h-4 mr-2" />
              {isConnected ? 'Reconectar' : 'Conectar Mercado Livre'}
            </Button>
          )}
          {isConnected && (
            <Button
              variant="destructive"
              onClick={() => { if (confirm('Desconectar do Mercado Livre?')) disconnectMutation.mutate() }}
              disabled={disconnectMutation.isPending}
            >
              <Unlink className="w-4 h-4 mr-2" />
              Desconectar
            </Button>
          )}
        </CardContent>
      </Card>

      {isConnected && Array.isArray(listings) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anúncios ativos ({listings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {listings.slice(0, 20).map((l, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{l.title}</p>
                    <p className="text-xs text-muted-foreground">{l.mlId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">R$ {l.price?.toFixed(2)}</span>
                    <Badge variant="outline" className="text-xs">{l.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
