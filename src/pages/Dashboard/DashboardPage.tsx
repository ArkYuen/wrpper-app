import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import type { DashboardSummary, DashboardConversions, ApiConnection } from '../../types'
import clsx from 'clsx'

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function fmtNum(n: number) {
  return n.toLocaleString()
}

function connectionStatusBadge(conn: ApiConnection) {
  if (!conn.enabled) return <span className="badge-idle"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Paused</span>
  if (conn.status === 'active') return <span className="badge-live"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Live</span>
  if (conn.status === 'expiring') return <span className="badge-warn"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Expiring</span>
  return <span className="badge-error"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Disconnected</span>
}

function platformName(p: string) {
  const map: Record<string, string> = { meta: 'Meta', tiktok: 'TikTok', google: 'Google', linkedin: 'LinkedIn', snapchat: 'Snapchat', reddit: 'Reddit', pinterest: 'Pinterest' }
  return map[p] || p
}

export default function DashboardPage() {
  const { org } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [conversions, setConversions] = useState<DashboardConversions | null>(null)
  const [connections, setConnections] = useState<ApiConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!org) return
    setLoading(true)
    Promise.all([
      apiFetch<DashboardSummary>('/v1/dashboard/summary?days=30'),
      apiFetch<DashboardConversions>('/v1/dashboard/conversions?days=30'),
      apiFetch<ApiConnection[]>(`/v1/orgs/${org.id}/connections`),
    ])
      .then(([s, c, conn]) => {
        setSummary(s)
        setConversions(c)
        setConnections(conn.filter(x => x.status !== 'disconnected'))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [org])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 pt-10">
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
      </div>
    )
  }

  const hasData = summary && summary.total_clicks > 0

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Overview"
        description={`Last 30 days`}
        action={org ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">
            {org.name}
          </span>
        ) : undefined}
      />

      <div className="px-6 pb-10 space-y-6">

        {/* CAPI connections strip */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">CAPI connections</p>
            <Link to="/connections" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              Manage →
            </Link>
          </div>
          {connections.length === 0 ? (
            <div className="card text-center py-6">
              <p className="text-sm text-gray-400 mb-3">No platforms connected yet.</p>
              <Link to="/connections" className="btn-primary text-xs">Connect a platform</Link>
            </div>
          ) : (
            <div className={clsx('grid gap-3', connections.length >= 3 ? 'grid-cols-3' : connections.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
              {connections.map(c => (
                <div key={c.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-800">{platformName(c.platform)}</span>
                    {connectionStatusBadge(c)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-400">Events fired</p>
                      <p className="font-semibold text-gray-800 mt-0.5">{fmtNum(c.total_events_fired)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Last event</p>
                      <p className="text-gray-600 mt-0.5">{c.last_event_at ? new Date(c.last_event_at).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!hasData ? (
          /* Empty state */
          <div className="card text-center py-10">
            <p className="text-sm font-medium text-gray-700 mb-1">No attribution data yet</p>
            <p className="text-xs text-gray-400 mb-4">Install the wrp.js pixel and create your first link to start tracking.</p>
            <div className="flex gap-3 justify-center">
              <Link to="/settings" className="btn-primary text-xs">Install pixel</Link>
              <Link to="/connections" className="btn-secondary text-xs">Connect platform</Link>
            </div>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total clicks</p>
                <p className="text-2xl font-semibold text-gray-900 leading-none">{fmtNum(summary!.total_clicks)}</p>
                {summary!.pct_change !== null && (
                  <p className={clsx('text-xs mt-1.5', summary!.pct_change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {summary!.pct_change >= 0 ? '+' : ''}{summary!.pct_change}%
                  </p>
                )}
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Conversions</p>
                <p className="text-2xl font-semibold text-gray-900 leading-none">{fmtNum(conversions!.total_conversions)}</p>
                <p className="text-xs mt-1.5 text-gray-400">{conversions!.conversion_rate}% rate</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Net revenue</p>
                <p className="text-2xl font-semibold text-emerald-700 leading-none">{fmtCurrency(conversions!.net_revenue_cents)}</p>
                {conversions!.total_refund_cents > 0 && (
                  <p className="text-xs mt-1.5 text-red-500">-{fmtCurrency(conversions!.total_refund_cents)} refunds</p>
                )}
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Unique visitors</p>
                <p className="text-2xl font-semibold text-gray-900 leading-none">{fmtNum(summary!.unique_visitors)}</p>
                <p className="text-xs mt-1.5 text-gray-400">{fmtNum(summary!.bots_filtered)} bots filtered</p>
              </div>
            </div>

            {/* Conversion breakdown */}
            {conversions!.by_type.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Conversions by type</p>
                <div className="grid grid-cols-4 gap-3">
                  {conversions!.by_type.map(t => (
                    <div key={t.event_type} className="card">
                      <p className="text-xs text-gray-500 mb-1 capitalize">{t.event_type.replace(/_/g, ' ')}</p>
                      <p className="text-lg font-semibold text-gray-900">{fmtNum(t.count)}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">{fmtCurrency(t.revenue_cents)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
