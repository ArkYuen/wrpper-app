import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import type { CreatorStat } from '../../types'
import clsx from 'clsx'

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-red-100 text-red-700',
  'bg-indigo-100 text-indigo-700',
]

export default function InfluencersPage() {
  const { org } = useAuth()
  const [creators, setCreators] = useState<CreatorStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!org) return
    apiFetch<{ creators: CreatorStat[] }>('/v1/dashboard/creators?days=30')
      .then(data => setCreators(data.creators || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [org])

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Influencers"
        description="Performance leaderboard — ranked by total clicks this period."
      />

      <div className="px-6 pb-10">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <span className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : creators.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-sm text-gray-400">No creator data yet. Create wrapped links for your creators to start tracking performance.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['#', 'Creator', 'Clicks', 'Conversions', 'Revenue', 'Conv rate'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creators.map((c, i) => {
                  const initials = (c.display_name || c.handle || '??').slice(0, 2).toUpperCase()
                  const color = COLORS[i % COLORS.length]
                  return (
                    <tr key={c.creator_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                      <td className="px-4 py-3 text-xs font-semibold text-gray-400 tabular-nums">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0', color)}>
                            {initials}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-800">{c.display_name || c.handle}</p>
                            {c.handle && c.display_name && (
                              <p className="text-[11px] text-gray-400">@{c.handle}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700 tabular-nums">{c.total_clicks.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">{c.total_conversions.toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-emerald-700 tabular-nums">{fmtCurrency(c.total_revenue_cents)}</td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          c.conversion_rate >= 5 ? 'bg-emerald-50 text-emerald-700' :
                          c.conversion_rate >= 2 ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        )}>
                          {c.conversion_rate}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
