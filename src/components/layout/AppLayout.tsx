import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { useAuth } from '../context/AuthContext'

export function AppLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/signin" replace />

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-[220px] overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
