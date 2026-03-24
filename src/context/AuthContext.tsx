import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'
import type { DashboardMe } from '../types'

interface OrgInfo {
  id: string
  name: string
  slug: string
}

interface AuthContextType {
  session: Session | null
  user: User | null
  org: OrgInfo | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, org: null, loading: true, signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [org, setOrg] = useState<OrgInfo | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchOrg() {
    try {
      const data = await apiFetch<DashboardMe>('/v1/dashboard/me')
      setOrg(data.organization)
    } catch {
      // First login or network issue — org will be created server-side
      setOrg(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchOrg().finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchOrg()
      } else {
        setOrg(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setOrg(null)
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, org, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
