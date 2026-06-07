import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useEffect, useState } from 'react'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { toast } from 'sonner'
import {
  LayoutDashboard, Package, TrendingUp, Users, ShoppingCart,
  Brain, Bell, Settings, LogOut, Menu, X, Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Produtos' },
  { to: '/products/trending', icon: TrendingUp, label: 'Trending' },
  { to: '/competitors', icon: Users, label: 'Concorrentes' },
  { to: '/sales', icon: ShoppingCart, label: 'Vendas' },
  { to: '/ai', icon: Brain, label: 'IA' },
  { to: '/notifications', icon: Bell, label: 'Notificações' },
]

const settingsItems = [
  { to: '/settings/marketplace', icon: Store, label: 'Marketplace' },
  { to: '/settings/profile', icon: Settings, label: 'Perfil' },
  { to: '/settings/organization', icon: Settings, label: 'Organização' },
]

export function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications')
      return res.data.data as Array<{ id: string; read: boolean }>
    },
    refetchInterval: 60_000,
  })

  const unread = notifs?.filter((n) => !n.read).length ?? 0

  useEffect(() => {
    if (!user?.organizationId) return
    const socket = connectSocket(user.organizationId)

    socket.on('NEW_SALE', (payload) => {
      toast.success(`Nova venda! R$ ${payload.data.value.toFixed(2)} — ${payload.data.productTitle}`)
      qc.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
    })

    socket.on('TREND_DETECTED', (payload) => {
      toast.info(`Produto viral: ${payload.data.productTitle} (score ${payload.data.trendScore})`)
      qc.invalidateQueries({ queryKey: ['products'] })
    })

    socket.on('COMPETITOR_UPDATE', (payload) => {
      toast.warning(`Concorrente: ${payload.data.details}`)
    })

    socket.on('MARKETPLACE_ERROR', (payload) => {
      toast.error(`Marketplace: ${payload.data.error}`)
    })

    socket.on('NOTIFICATION', () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    })

    return () => { disconnectSocket() }
  }, [user?.organizationId, qc])

  function handleLogout() {
    disconnectSocket()
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'US'

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : 'w-64'} bg-sidebar`}>
      {/* Logo header */}
      <div className="px-5 py-4 border-b border-sidebar-border flex items-center gap-3">
        <img src="/logo.svg" alt="SellerAI" className="w-9 h-9 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-sidebar-foreground text-lg leading-none">
            Seller<span className="text-[oklch(0.72_0.18_155)]">AI</span>
          </span>
          <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest mt-0.5 leading-none">
            Vender Mais
          </p>
        </div>
        {mobile && (
          <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-sidebar-foreground/40 px-3 pb-2 uppercase tracking-widest">
          Menu
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/products' || to === '/dashboard'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {label === 'Notificações' && unread > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 min-w-4 px-1 flex items-center justify-center leading-none">
                {unread}
              </Badge>
            )}
          </NavLink>
        ))}

        <div className="pt-4">
          <p className="text-[10px] font-semibold text-sidebar-foreground/40 px-3 pb-2 uppercase tracking-widest">
            Configurações
          </p>
          {settingsItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs bg-[oklch(0.58_0.18_155)] text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate leading-tight">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="shrink-0 w-7 h-7 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex shrink-0 border-r border-sidebar-border">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative z-10 w-64">
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <img src="/logo.svg" alt="SellerAI" className="w-7 h-7" />
          <span className="font-bold text-base">
            Seller<span className="text-primary">AI</span>
          </span>
          {unread > 0 && (
            <Badge variant="destructive" className="ml-auto">{unread}</Badge>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
