import { PageHeader } from '../../components/common/PageHeader'
import clsx from 'clsx'

const INFLUENCERS = [
  { id: 'inf_m_44821', name: 'Talia Morrow', handle: '@taliamorrow', platform: 'Meta', clicks: 4820, conv: 312, revenue: '$27,808', score: 94, initials: 'TM', color: 'bg-purple-100 text-purple-700' },
  { id: 'inf_t_90023', name: 'Jordan Wex', handle: '@jwex_', platform: 'TikTok', clicks: 3901, conv: 241, revenue: '$19,280', score: 88, initials: 'JW', color: 'bg-blue-100 text-blue-700' },
  { id: 'inf_m_77143', name: 'Rosa Feng', handle: '@rosafeng.co', platform: 'Meta', clicks: 3210, conv: 198, revenue: '$14,058', score: 91, initials: 'RF', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'inf_g_10982', name: 'Marcus Dell', handle: '@marcus.d', platform: 'Google', clicks: 2780, conv: 155, revenue: '$10,230', score: 72, initials: 'MD', color: 'bg-amber-100 text-amber-700' },
  { id: 'inf_t_55511', name: 'Sasha K', handle: '@sashakontent', platform: 'TikTok', clicks: 2041, conv: 133, revenue: '$8,645', score: 83, initials: 'SK', color: 'bg-pink-100 text-pink-700' },
]

function platformStyle(p: string) {
  if (p === 'Meta') return 'bg-blue-50 text-blue-700'
  if (p === 'TikTok') return 'bg-purple-50 text-purple-700'
  return 'bg-green-50 text-green-700'
}

export default function InfluencersPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Influencers"
        description="Performance leaderboard — ranked by total clicks this period."
      />

      <div className="px-6 pb-10">
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['#', 'Creator', 'Platform', 'Influencer ID', 'Clicks', 'Conversions', 'Revenue', 'Avg match'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INFLUENCERS.map((inf, i) => (
                <tr key={inf.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                  <td className="px-4 py-3 text-xs font-semibold text-gray-400 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0', inf.color)}>
                        {inf.initials}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800">{inf.name}</p>
                        <p className="text-[11px] text-gray-400">{inf.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', platformStyle(inf.platform))}>
                      {inf.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      {inf.id}
                    </code>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-700 tabular-nums">{inf.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">{inf.conv.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-emerald-700 tabular-nums">{inf.revenue}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full', inf.score >= 85 ? 'bg-emerald-500' : inf.score >= 70 ? 'bg-amber-400' : 'bg-red-400')}
                          style={{ width: `${inf.score}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{inf.score}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
