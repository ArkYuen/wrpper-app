import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import clsx from 'clsx'

const ALL_EVENTS = [
  { ts: 'Mar 17, 09:14', platform: 'Meta', infId: 'inf_m_44821', event: 'Purchase', clicks: 312, dedup: true, score: 94, value: '$89.00' },
  { ts: 'Mar 17, 08:52', platform: 'TikTok', infId: 'inf_t_90023', event: 'Lead', clicks: 188, dedup: true, score: 87, value: '—' },
  { ts: 'Mar 17, 08:31', platform: 'Meta', infId: 'inf_m_77143', event: 'AddToCart', clicks: 241, dedup: true, score: 91, value: '$45.00' },
  { ts: 'Mar 17, 07:58', platform: 'Google', infId: 'inf_g_10982', event: 'Purchase', clicks: 76, dedup: false, score: 72, value: '$120.00' },
  { ts: 'Mar 17, 07:22', platform: 'TikTok', infId: 'inf_t_55511', event: 'ViewContent', clicks: 903, dedup: true, score: 83, value: '—' },
  { ts: 'Mar 16, 22:41', platform: 'Meta', infId: 'inf_m_30019', event: 'Purchase', clicks: 197, dedup: true, score: 96, value: '$65.00' },
  { ts: 'Mar 16, 21:17', platform: 'TikTok', infId: 'inf_t_90023', event: 'AddToCart', clicks: 144, dedup: true, score: 88, value: '$32.00' },
  { ts: 'Mar 16, 19:03', platform: 'Google', infId: 'inf_g_20041', event: 'Lead', clicks: 59, dedup: true, score: 79, value: '—' },
  { ts: 'Mar 16, 14:30', platform: 'Meta', infId: 'inf_m_44821', event: 'Purchase', clicks: 288, dedup: true, score: 93, value: '$74.00' },
  { ts: 'Mar 16, 11:05', platform: 'TikTok', infId: 'inf_t_12234', event: 'ViewContent', clicks: 540, dedup: true, score: 80, value: '—' },
]

const FILTERS = ['All', 'Purchase', 'Lead', 'AddToCart', 'ViewContent']

function platformStyle(p: string) {
  if (p === 'Meta') return 'bg-blue-50 text-blue-700'
  if (p === 'TikTok') return 'bg-purple-50 text-purple-700'
  return 'bg-green-50 text-green-700'
}

function eventStyle(e: string) {
  if (e === 'Purchase') return 'bg-emerald-50 text-emerald-700'
  if (e === 'Lead') return 'bg-blue-50 text-blue-700'
  if (e === 'AddToCart') return 'bg-amber-50 text-amber-700'
  return 'bg-gray-100 text-gray-500'
}

export default function AnalyticsPage() {
  const [filter, setFilter] = useState('All')

  const rows = filter === 'All' ? ALL_EVENTS : ALL_EVENTS.filter(e => e.event === filter)

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Attribution Events"
        description="Server-side click and conversion events forwarded to your ad platforms."
      />

      <div className="px-6 pb-10">
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                filter === f
                  ? 'bg-brand-50 border-brand-200 text-brand-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Timestamp', 'Platform', 'Influencer ID', 'Event', 'Clicks', 'Value', 'Dedup', 'Match score'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors last:border-0">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">{e.ts}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', platformStyle(e.platform))}>
                      {e.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                      {e.infId}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', eventStyle(e.event))}>
                      {e.event}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-700 tabular-nums">{e.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 tabular-nums">{e.value}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('w-2 h-2 rounded-full inline-block', e.dedup ? 'bg-emerald-500' : 'bg-red-400')} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full', e.score >= 85 ? 'bg-emerald-500' : e.score >= 70 ? 'bg-amber-400' : 'bg-red-400')}
                          style={{ width: `${e.score}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">{e.score}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Showing {rows.length} of {ALL_EVENTS.length} events</span>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1.5">← Prev</button>
              <button className="btn-secondary text-xs py-1.5">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
