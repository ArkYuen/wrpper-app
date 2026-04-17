import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import DashboardPage from './pages/Dashboard/DashboardPage'
import ConnectionsPage from './pages/Connections/ConnectionsPage'
import AnalyticsPage from './pages/Analytics/AnalyticsPage'
import InfluencersPage from './pages/Influencers/InfluencersPage'
import SettingsPage from './pages/Settings/SettingsPage'
import BillingPage from './pages/Billing/BillingPage'
import SignInPage from './pages/AuthPages/SignInPage'
import SignUpPage from './pages/AuthPages/SignUpPage'
import ResetPasswordPage from './pages/AuthPages/ResetPasswordPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Protected */}
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="connections" element={<ConnectionsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="influencers" element={<InfluencersPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Auth */}
          <Route path="signin" element={<SignInPage />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
