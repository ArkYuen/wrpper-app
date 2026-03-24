import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import type { DashboardMe, PixelSnippet } from '../../types'

export default function SettingsPage() {
  const { user, org } = useAuth()
  const [me, setMe] = useState<DashboardMe | null>(null)
  const [pixel, setPixel] = useState<PixelSnippet | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!org) return
    Promise.all([
      apiFetch<DashboardMe>('/v1/dashboard/me'),
      apiFetch<PixelSnippet>('/v1/dashboard/pixel-snippet'),
    ])
      .then(([m, p]) => { setMe(m); setPixel(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [org])

  function handleCopy() {
    if (!pixel) return
    navigator.clipboard.writeText(pixel.snippet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Settings" description="Manage your organization and account." />

      <div className="px-6 pb-10 max-w-2xl space-y-6">

        {/* Account */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Account</h2>
          <div className="border-t border-gray-100" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="font-mono text-gray-700">{me?.user.email || user?.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">User ID</p>
              <p className="font-mono text-xs text-gray-500 truncate">{me?.user.id || user?.id || '—'}</p>
            </div>
            {me?.user.full_name && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Name</p>
                <p className="text-gray-700">{me.user.full_name}</p>
              </div>
            )}
            {me?.user.last_login_at && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Last login</p>
                <p className="text-gray-600 text-xs">{new Date(me.user.last_login_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Organization */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Organization</h2>
          <div className="border-t border-gray-100" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Org name</p>
              <p className="text-gray-700">{me?.organization.name || org?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Org ID</p>
              <p className="font-mono text-xs text-gray-500 truncate">{me?.organization.id || org?.id || '—'}</p>
            </div>
          </div>
        </div>

        {/* wrp.js pixel */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">wrp.js pixel</h2>
            <button
              onClick={handleCopy}
              className="btn-secondary text-xs py-1.5"
            >
              {copied ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copied
                </span>
              ) : 'Copy snippet'}
            </button>
          </div>
          <div className="border-t border-gray-100" />
          <p className="text-xs text-gray-400">
            {pixel?.instructions || 'Add this script tag to every page on your advertiser\'s website, just before </body>.'}
          </p>
          <pre className="text-[11px] font-mono bg-gray-900 text-green-300 rounded-lg p-3 overflow-x-auto leading-relaxed">
            {pixel?.snippet || 'Loading...'}
          </pre>
          {pixel && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400 mb-0.5">Publishable key</p>
                <code className="font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{pixel.pub_key}</code>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Pixel URL</p>
                <code className="font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{pixel.pixel_url}</code>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
