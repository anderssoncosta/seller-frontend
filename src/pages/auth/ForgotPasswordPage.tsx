import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

const schema = z.object({ email: z.string().email('Email inválido') })
type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: (data: Form) => api.post('/auth/forgot-password', data),
    onSuccess: () => toast.success('Se o e-mail existir, você receberá as instruções.'),
    onError: () => toast.error('Erro ao enviar email'),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recuperar senha</CardTitle>
            <CardDescription>Enviaremos um link para seu email</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <p className="text-sm text-center text-muted-foreground py-4">
                Verifique seu email para as instruções de redefinição de senha.
              </p>
            ) : (
              <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="voce@empresa.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? 'Enviando...' : 'Enviar link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-foreground hover:underline">← Voltar ao login</Link>
        </p>
      </div>
    </div>
  )
}
