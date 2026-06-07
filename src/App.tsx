import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import ProductsPage from '@/pages/products/ProductsPage'
import ProductDetailPage from '@/pages/products/ProductDetailPage'
import TrendingPage from '@/pages/products/TrendingPage'
import CompetitorsPage from '@/pages/CompetitorsPage'
import SalesPage from '@/pages/SalesPage'
import AIPage from '@/pages/AIPage'
import NotificationsPage from '@/pages/NotificationsPage'
import MarketplacePage from '@/pages/settings/MarketplacePage'
import ProfilePage from '@/pages/settings/ProfilePage'
import OrganizationPage from '@/pages/settings/OrganizationPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/trending" element={<TrendingPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="competitors" element={<CompetitorsPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="ai" element={<AIPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings/marketplace" element={<MarketplacePage />} />
        <Route path="settings/profile" element={<ProfilePage />} />
        <Route path="settings/organization" element={<OrganizationPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
