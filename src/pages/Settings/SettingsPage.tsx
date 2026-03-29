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
  const [pubKey, setPubKey] = useState<{ key: string | null; prefix: string | null } | null>(null)
  const [pubKeyRevealed, setPubKeyRevealed] = useState(false)
  const [pubKeyCopied, setPubKeyCopied] = useState(false)
  const [pubKeyError, setPubKeyError] = useState('')

  useEffect(() => {
    if (!org) return
    Promise.all([
      apiFetch<DashboardMe>('/v1/dashboard/me'),
      apiFetch<PixelSnippet>('/v1/dashboard/pixel-snippet'),
      apiFetch<{ key: string | null; prefix: string | null }>('/v1/dashboard/publishable-key')
        .catch(() => { setPubKeyError('Failed to load publishable key'); return null }),
    ])
      .then(([m, p, pk]) => { setMe(m); setPixel(p); if (pk) setPubKey(pk) })
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

  function handlePubKeyCopy() {
    if (!pubKey?.key) return
    navigator.clipboard.writeText(pubKey.key).then(() => {
      setPubKeyCopied(true)
      setTimeout(() => setPubKeyCopied(false), 2000)
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

        {/* Publishable Key */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Publishable Key</h2>
          <div className="border-t border-gray-100" />
          {pubKeyError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              {pubKeyError}
            </div>
          )}
          {pubKey ? (
            <>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  type={pubKeyRevealed ? 'text' : 'password'}
                  value={pubKey.key ?? pubKey.prefix ?? '—'}
                  className="input flex-1 font-mono text-xs bg-gray-50"
                />
                <button
                  onClick={() => setPubKeyRevealed(r => !r)}
                  disabled={!pubKey.key}
                  className="btn-secondary px-2.5 py-2"
                  title={pubKeyRevealed ? 'Hide' : 'Reveal'}
                >
                  {pubKeyRevealed ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 2l12 12M6.5 6.5a2 2 0 002.83 2.83M3.3 5.3C2.1 6.4 1.3 7.7 1.3 8c0 1.7 3 5 6.7 5 .8 0 1.6-.2 2.3-.4M8 3c3.7 0 6.7 3.3 6.7 5 0 .3-.2.8-.6 1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1.3 8c0-1.7 3-5 6.7-5s6.7 3.3 6.7 5-3 5-6.7 5S1.3 9.7 1.3 8z" stroke="currentColor" strokeWidth="1.3"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                    </svg>
                  )}
                </button>
                <button
                  onClick={handlePubKeyCopy}
                  disabled={!pubKey.key}
                  className="btn-secondary px-2.5 py-2"
                  title="Copy to clipboard"
                >
                  {pubKeyCopied ? (
                    <span className="text-emerald-600">
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Use this key in your pixel snippet and GTM tag configuration. Safe to expose client-side.
              </p>
              {!pubKey.key && pubKey.prefix && (
                <p className="text-xs text-amber-600">
                  Full key unavailable — only the prefix ({pubKey.prefix}...) is stored. Contact support to regenerate.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400">No publishable key found.</p>
          )}
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
