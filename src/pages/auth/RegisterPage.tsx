import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  organizationName: z.string().min(2, 'Nome da empresa obrigatório'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})
type Form = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Form) => api.post('/auth/register', data),
    onSuccess: ({ data }) => {
      const d = data.data
      setAuth(d.user, d.accessToken, d.refreshToken)
      toast.success('Conta criada com sucesso!')
      navigate('/dashboard')
    },
    onError: (err: any) => {
      if (err.response?.status === 409) toast.error('Email já cadastrado')
      else toast.error('Erro ao criar conta')
    },
  })

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-[#0D1B2A] px-10 py-12">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="SellerAI" className="w-10 h-10" />
          <span className="text-xl font-bold text-white">
            Seller<span className="text-[#00e87a]">AI</span>
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Comece a vender<br />
              <span className="text-[#00e87a]">com inteligência</span>
            </h2>
            <p className="mt-4 text-white/50 text-sm leading-relaxed">
              Crie sua conta gratuitamente e tenha acesso a todas as ferramentas de análise e monitoramento do SellerAI.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Análise de produtos em tempo real',
              'Alertas de concorrência automáticos',
              'Relatórios de vendas completos',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-[#00e87a]/20 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00e87a]" />
                </div>
                <span className="text-sm text-white/60">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/20">© 2026 SellerAI. Todos os direitos reservados.</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center gap-2">
            <img src="/logo.svg" alt="SellerAI" className="w-12 h-12" />
            <span className="text-2xl font-bold">
              Seller<span className="text-primary">AI</span>
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Criar sua conta</h1>
            <p className="mt-1 text-sm text-muted-foreground">Preencha os dados abaixo para começar</p>
          </div>

          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="João Silva" className="h-11" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="voce@empresa.com" className="h-11" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="organizationName">Nome da empresa</Label>
              <Input id="organizationName" placeholder="Minha Empresa Ltda" className="h-11" {...register('organizationName')} />
              {errors.organizationName && <p className="text-xs text-destructive">{errors.organizationName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="Mínimo 8 caracteres" className="h-11" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full h-11 font-semibold mt-2" disabled={isPending}>
              {isPending ? 'Criando conta...' : 'Criar conta grátis'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
