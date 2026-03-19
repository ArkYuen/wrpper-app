import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import clsx from 'clsx'

const CAPI_HEALTH = [
  { platform: 'Meta', status: 'live', events: '14,302', match: 91, expiresIn: 47 },
  { platform: 'TikTok', status: 'live', events: '8,741', match: 84, expiresIn: 12 },
  { platform: 'Google', status: 'expiring', events: '4,218', match: 78, expiresIn: 3 },
]

const METRICS = [
  { label: 'Total clicks', value: '27,261', delta: '+18%', up: true },
  { label: 'Conversions', value: '1,408', delta: '+9%', up: true },
  { label: 'Dedup rate', value: '96.2%', delta: 'event_id matched', up: null },
  { label: 'Active influencers', value: '34', delta: '3 platforms', up: null },
]

const TOP_EVENTS = [
  { ts: 'Mar 17, 09:14', platform: 'Meta', infId: 'inf_m_44821', event: 'Purchase', clicks: 312, score: 94 },
  { ts: 'Mar 17, 08:52', platform: 'TikTok', infId: 'inf_t_90023', event: 'Lead', clicks: 188, score: 87 },
  { ts: 'Mar 17, 08:31', platform: 'Meta', infId: 'inf_m_77143', event: 'AddToCart', clicks: 241, score: 91 },
  { ts: 'Mar 17, 07:58', platform: 'Google', infId: 'inf_g_10982', event: 'Purchase', clicks: 76, score: 72 },
  { ts: 'Mar 17, 07:22', platform: 'TikTok', infId: 'inf_t_55511', event: 'ViewContent', clicks: 903, score: 83 },
]

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

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Overview"
        description="Mar 1 – Mar 17, 2026"
        action={
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">
            Acme Brand Co.
          </span>
        }
      />

      <div className="px-6 pb-10 space-y-6">

        {/* CAPI health strip */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">CAPI connections</p>
            <Link to="/connections" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              Manage →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {CAPI_HEALTH.map(c => (
              <div key={c.platform} className={clsx(
                'card relative',
                c.status === 'expiring' && 'border-amber-200 bg-amber-50/30'
              )}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-800">{c.platform}</span>
                  {c.status === 'live' ? (
                    <span className="badge-live"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Live</span>
                  ) : (
                    <span className="badge-warn"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Expiring {c.expiresIn}d</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Events sent</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{c.events}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Match rate</p>
                    <p className={clsx(
                      'font-semibold mt-0.5',
                      c.match >= 85 ? 'text-emerald-600' : c.match >= 75 ? 'text-amber-600' : 'text-red-600'
                    )}>{c.match}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3">
          {METRICS.map(m => (
            <div key={m.label} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{m.label}</p>
              <p className="text-2xl font-semibold text-gray-900 leading-none">{m.value}</p>
              <p className={clsx(
                'text-xs mt-1.5',
                m.up === true ? 'text-emerald-600' :
                m.up === false ? 'text-red-500' :
                'text-gray-400'
              )}>{m.delta}</p>
            </div>
          ))}
        </div>

        {/* Recent events */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Recent attribution events</p>
            <Link to="/analytics" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Timestamp', 'Platform', 'Influencer ID', 'Event', 'Clicks', 'Match'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_EVENTS.map((e, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{e.ts}</td>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
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
          </div>
        </div>

      </div>
    </div>
  )
}
