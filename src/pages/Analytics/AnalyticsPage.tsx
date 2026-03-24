import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import type { ClicksResponse, ClickRow } from '../../types'
import clsx from 'clsx'
import { format } from 'date-fns'

function platformStyle(p: string | null) {
  if (!p) return 'bg-gray-100 text-gray-500'
  if (p.includes('tiktok')) return 'bg-purple-50 text-purple-700'
  if (p.includes('instagram') || p.includes('meta') || p.includes('facebook')) return 'bg-blue-50 text-blue-700'
  if (p.includes('youtube') || p.includes('google')) return 'bg-green-50 text-green-700'
  if (p.includes('twitter') || p.includes('x.com')) return 'bg-gray-100 text-gray-700'
  if (p.includes('linkedin')) return 'bg-blue-50 text-blue-800'
  return 'bg-gray-100 text-gray-500'
}

export default function AnalyticsPage() {
  const { org } = useAuth()
  const [clicks, setClicks] = useState<ClickRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const perPage = 50

  useEffect(() => {
    if (!org) return
    setLoading(true)
    apiFetch<ClicksResponse>(`/v1/dashboard/clicks?page=${page}&per_page=${perPage}`)
      .then(data => {
        setClicks(data.clicks)
        setTotal(data.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [org, page])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Attribution Events"
        description="Click events tracked by Wrpper across all creator links."
      />

      <div className="px-6 pb-10">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <span className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clicks.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-sm text-gray-400">No click events yet. Create a wrapped link and share it to start tracking.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Timestamp', 'Platform', 'Creator', 'Device', 'Country', 'Risk', 'Bot'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clicks.map(c => (
                  <tr key={c.click_id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors last:border-0">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">
                      {format(new Date(c.created_at), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', platformStyle(c.source_platform))}>
                        {c.source_platform || 'direct'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.creator_handle ? (
                        <code className="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{c.creator_handle}</code>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">{c.device_class || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{c.country_code || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={clsx('h-full rounded-full', c.risk_score < 0.3 ? 'bg-emerald-500' : c.risk_score < 0.7 ? 'bg-amber-400' : 'bg-red-400')}
                            style={{ width: `${Math.min(c.risk_score * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-500 tabular-nums">{(c.risk_score * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('w-2 h-2 rounded-full inline-block', c.is_suspected_bot ? 'bg-red-400' : 'bg-emerald-500')} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Page {page} of {totalPages} ({total.toLocaleString()} total clicks)
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary text-xs py-1.5 disabled:opacity-40">
                  ← Prev
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary text-xs py-1.5 disabled:opacity-40">
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
