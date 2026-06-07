import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import type { Organization, OrganizationPlan } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings } from 'lucide-react'
import { useEffect } from 'react'

const planColors: Record<OrganizationPlan, string> = {
  FREE: 'secondary', STARTER: 'outline', PRO: 'default', ENTERPRISE: 'default',
} as any

const schema = z.object({ name: z.string().min(2, 'Nome obrigatório') })
type Form = z.infer<typeof schema>

export default function OrganizationPage() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', user?.organizationId],
    queryFn: async () => {
      const res = await api.get(`/organizations/${user?.organizationId}`)
      return res.data.data as Organization
    },
    enabled: !!user?.organizationId,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (org) reset({ name: org.name })
  }, [org, reset])

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Form) => api.patch(`/organizations/${org?.id}`, d),
    onSuccess: () => {
      toast.success('Organização atualizada!')
      qc.invalidateQueries({ queryKey: ['organization'] })
    },
    onError: () => toast.error('Erro ao atualizar organização'),
  })

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="w-6 h-6" /> Organização
      </h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{isLoading ? <Skeleton className="h-5 w-32" /> : org?.name}</CardTitle>
              <CardDescription className="mt-1">
                {isLoading ? <Skeleton className="h-4 w-20 mt-1" /> : (
                  <span className="flex items-center gap-2">
                    Plano: <Badge variant={(planColors[org?.plan as OrganizationPlan] ?? 'outline') as 'default' | 'outline' | 'secondary'}>{org?.plan}</Badge>
                    · Status: <Badge variant="outline">{org?.status}</Badge>
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-9 w-24" /></div>
          ) : (
            <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
              <div className="space-y-1">
                <Label>Nome da organização</Label>
                <Input {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planos disponíveis</CardTitle>
          <CardDescription>Faça upgrade para desbloquear mais recursos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {(['FREE', 'STARTER', 'PRO', 'ENTERPRISE'] as OrganizationPlan[]).map((plan) => (
              <div
                key={plan}
                className={`p-3 rounded-lg border text-sm ${org?.plan === plan ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{plan}</span>
                  {org?.plan === plan && <Badge variant="default" className="text-xs">Atual</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {plan === 'FREE' && 'Básico, sem custo'}
                  {plan === 'STARTER' && 'Para pequenas lojas'}
                  {plan === 'PRO' && 'Recursos avançados'}
                  {plan === 'ENTERPRISE' && 'Personalizado'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
