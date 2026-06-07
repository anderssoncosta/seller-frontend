import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { Notification, NotificationType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell, Trash2, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function notifTypeLabel(t: NotificationType): string {
  const map: Record<NotificationType, string> = {
    NEW_SALE: 'Nova venda',
    VIRAL_PRODUCT: 'Produto viral',
    COMPETITOR_PRICE_CHANGE: 'Mudança de preço',
    MARKETPLACE_DISCONNECTED: 'Marketplace',
  }
  return map[t] ?? t
}

function notifTypeColor(t: NotificationType): string {
  const map: Record<NotificationType, string> = {
    NEW_SALE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    VIRAL_PRODUCT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    COMPETITOR_PRICE_CHANGE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    MARKETPLACE_DISCONNECTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }
  return map[t] ?? ''
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications')
      return res.data.data as Notification[]
    },
  })

  const readMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const readAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: ({ data }) => {
      toast.success(data.data.message)
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Erro ao remover notificação'),
  })

  const unread = data?.filter((n) => !n.read).length ?? 0

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" /> Notificações
          </h1>
          {unread > 0 && <Badge variant="destructive">{unread} não lidas</Badge>}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => readAllMutation.mutate()} disabled={readAllMutation.isPending}>
            <CheckCheck className="w-4 h-4 mr-2" />Marcar todas como lidas
          </Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm text-muted-foreground">{data?.length ?? 0} notificações</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {data?.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    !n.read ? 'bg-accent/30 border-primary/20' : 'border-transparent hover:bg-accent/10'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${notifTypeColor(n.type)}`}>
                        {notifTypeLabel(n.type)}
                      </span>
                      {!n.read && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                    </div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(n.createdAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => readMutation.mutate(n.id)}>
                        <CheckCheck className="w-3 h-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(n.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {data?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma notificação.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
