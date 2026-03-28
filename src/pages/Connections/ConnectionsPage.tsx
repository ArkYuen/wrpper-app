import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { apiFetch, apiPost, apiDelete } from '../../lib/api'
import { API } from '../../lib/api'
import type { ApiConnection, CapiTestResult } from '../../types'
import clsx from 'clsx'

// ─── Platform config ─────────────────────────────────────────────────────────

interface PlatformDef {
  key: string
  name: string
  auth: 'paste' | 'oauth'
  color: string
  bgColor: string
  borderColor: string
  fields: { key: string; label: string; placeholder: string; required?: boolean }[]
  icon: React.ReactNode
}

const PLATFORMS: PlatformDef[] = [
  {
    key: 'meta', name: 'Meta', auth: 'paste', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-100',
    fields: [
      { key: 'platform_account_id', label: 'Pixel ID', placeholder: '123456789012345', required: true },
      { key: 'access_token', label: 'Access Token', placeholder: 'EAAG...', required: true },
      { key: 'secondary_id', label: 'Test Event Code (optional)', placeholder: 'TEST12345' },
    ],
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  },
  {
    key: 'tiktok', name: 'TikTok', auth: 'oauth', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-100',
    fields: [],
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.12V9.01a6.34 6.34 0 00-.82-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.2 8.2 0 004.77 1.52V6.94a4.85 4.85 0 01-1.01-.25z"/></svg>,
  },
  {
    key: 'linkedin', name: 'LinkedIn', auth: 'oauth', color: 'text-blue-800', bgColor: 'bg-blue-50', borderColor: 'border-blue-100',
    fields: [],
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  },
  {
    key: 'google', name: 'Google (GA4 + Ads)', auth: 'oauth', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-100',
    fields: [],
    icon: <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
  },
  {
    key: 'snapchat', name: 'Snapchat', auth: 'paste', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-100',
    fields: [
      { key: 'platform_account_id', label: 'Pixel ID', placeholder: 'snap-pixel-id', required: true },
      { key: 'access_token', label: 'Access Token', placeholder: 'Bearer token', required: true },
    ],
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFC00"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.98-.278a.71.71 0 01.322-.077.63.63 0 01.585.39.636.636 0 01-.104.66c-.14.18-.4.39-.92.62-.16.07-.38.15-.63.24l-.03.012c-.9.345-1.168.691-1.102 1.02.09.45.577.72.937.89l.043.02c.578.295 1.12.601 1.312 1.044a.86.86 0 01.009.665c-.36.87-1.86 1.47-4.594 1.834-.18.03-.21.15-.24.3l-.015.09c-.06.39-.12.81-.36 1.2-.36.585-1.08.84-1.74.84-.39 0-.78-.09-1.14-.24l-.03-.015c-.48-.21-1.02-.45-1.74-.45-.45 0-.93.09-1.38.27l-.03.015c-.36.15-.72.255-1.14.255-.66 0-1.38-.255-1.74-.84-.24-.39-.3-.81-.36-1.2l-.015-.09c-.03-.15-.06-.27-.24-.3-2.73-.36-4.23-.96-4.59-1.83a.87.87 0 01.009-.665c.19-.44.734-.75 1.312-1.044l.043-.02c.36-.17.847-.44.937-.89.066-.33-.202-.675-1.102-1.02l-.03-.012c-.24-.09-.47-.17-.63-.24-.52-.23-.78-.44-.92-.62a.636.636 0 01-.104-.66.63.63 0 01.585-.39.71.71 0 01.322.077c.32.16.68.264.98.278.198 0 .326-.045.4-.09-.007-.165-.017-.33-.03-.51l-.002-.06c-.104-1.628-.23-3.654.3-4.847C7.447 1.069 10.804.793 11.794.793h.412z"/></svg>,
  },
  {
    key: 'reddit', name: 'Reddit', auth: 'paste', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-100',
    fields: [
      { key: 'platform_account_id', label: 'Pixel ID', placeholder: 't2_xxxxx', required: true },
      { key: 'access_token', label: 'Access Token', placeholder: 'Bearer token', required: true },
    ],
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF4500"><path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 000-.462.342.342 0 00-.465 0c-.533.533-1.684.784-2.504.784-.82 0-1.958-.236-2.491-.784a.326.326 0 00-.231-.095z"/></svg>,
  },
  {
    key: 'pinterest', name: 'Pinterest', auth: 'paste', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-100',
    fields: [
      { key: 'platform_account_id', label: 'Ad Account ID', placeholder: '549755812345', required: true },
      { key: 'access_token', label: 'Access Token', placeholder: 'pina_...', required: true },
    ],
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#E60023"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.988-5.37 11.988-11.992C24.005 5.366 18.641 0 12.017 0z"/></svg>,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ conn }: { conn: ApiConnection }) {
  if (!conn.enabled) return <span className="badge-idle"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Paused</span>
  if (conn.status === 'active') return <span className="badge-live"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Live</span>
  if (conn.status === 'expiring') return <span className="badge-warn"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Expiring</span>
  return <span className="badge-error"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />{conn.status}</span>
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const { org } = useAuth()
  const [connections, setConnections] = useState<ApiConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [actionError, setActionError] = useState<Record<string, string>>({})

  // Meta test console state
  const [testCreds, setTestCreds] = useState({ pixel_id: '', access_token: '', test_event_code: '' })
  const [testResult, setTestResult] = useState<CapiTestResult | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [showTestConsole, setShowTestConsole] = useState(false)

  const [fetchError, setFetchError] = useState('')

  async function fetchConnections() {
    if (!org) return
    try {
      setFetchError('')
      const data = await apiFetch<ApiConnection[]>(`/v1/orgs/${org.id}/connections`)
      setConnections(data)
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load connections')
    }
    setLoading(false)
  }

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => { fetchConnections() }, [org])

  // Re-fetch after OAuth redirect returns with success/connected param
  useEffect(() => {
    if (searchParams.has('connected') || searchParams.has('success')) {
      fetchConnections()
      // Clean up URL params
      searchParams.delete('connected')
      searchParams.delete('success')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams])

  function getConnection(platform: string): ApiConnection | undefined {
    return connections.find(c => c.platform === platform && c.status !== 'disconnected')
  }

  async function handlePasteConnect(platformKey: string) {
    if (!org) return
    setSaving(true)
    setSaveError('')
    try {
      await apiPost(`/v1/orgs/${org.id}/connections/token`, {
        platform: platformKey,
        platform_account_id: formData.platform_account_id || '',
        access_token: formData.access_token || '',
        platform_account_label: formData.platform_account_label || undefined,
        secondary_id: formData.secondary_id || undefined,
      })
      setExpandedPlatform(null)
      setFormData({})
      await fetchConnections()
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
    }
    setSaving(false)
  }

  function handleOAuthConnect(platformKey: string) {
    if (!org) return
    window.location.href = `${API}/v1/oauth/${platformKey}/connect?org_id=${org.id}`
  }

  async function handleToggle(conn: ApiConnection) {
    if (!org) return
    setActionError(prev => ({ ...prev, [conn.id]: '' }))
    try {
      await apiFetch(`/v1/orgs/${org.id}/connections/${conn.id}/toggle`, { method: 'PATCH' })
      await fetchConnections()
    } catch (e: unknown) {
      setActionError(prev => ({ ...prev, [conn.id]: e instanceof Error ? e.message : 'Toggle failed' }))
    }
  }

  async function handleDisconnect(conn: ApiConnection) {
    if (!org) return
    if (!confirm(`Disconnect ${conn.platform}? This will remove the access token.`)) return
    setActionError(prev => ({ ...prev, [conn.id]: '' }))
    try {
      await apiDelete(`/v1/orgs/${org.id}/connections/${conn.id}`)
      await fetchConnections()
    } catch (e: unknown) {
      setActionError(prev => ({ ...prev, [conn.id]: e instanceof Error ? e.message : 'Disconnect failed' }))
    }
  }

  async function handleMetaTestEvent() {
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await apiPost<CapiTestResult>('/connections/meta/test-event', {
        pixel_id: testCreds.pixel_id,
        access_token: testCreds.access_token,
        event_name: 'PageView',
        test_event_code: testCreds.test_event_code || undefined,
      })
      setTestResult(res)
    } catch (e: unknown) {
      setTestResult({ success: false, event_id: '', error: e instanceof Error ? e.message : 'Failed' })
    }
    setTestLoading(false)
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
      <PageHeader
        title="Platform Connections"
        description="Connect your ad platforms to enable server-side CAPI attribution."
      />

      <div className="px-6 pb-10 space-y-6 max-w-4xl">

        {fetchError && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{fetchError}</div>
        )}

        {/* ── Platform grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {PLATFORMS.map(p => {
            const conn = getConnection(p.key)
            const isExpanded = expandedPlatform === p.key && !conn

            return (
              <div key={p.key} className={clsx('card space-y-3', conn && 'border-emerald-200')}>
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={clsx('w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0', p.bgColor, p.borderColor)}>
                      {p.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{p.name}</h3>
                      <p className="text-[11px] text-gray-400">
                        {p.auth === 'oauth' ? 'OAuth' : 'API token'} · {conn ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {conn ? <StatusBadge conn={conn} /> : null}
                </div>

                {/* Connected state */}
                {conn && (
                  <>
                    <div className="border-t border-gray-100" />
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-400">Events fired</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{conn.total_events_fired.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Last event</p>
                        <p className="text-gray-600 mt-0.5">{conn.last_event_at ? new Date(conn.last_event_at).toLocaleDateString() : '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Account</p>
                        <p className="text-gray-600 mt-0.5 truncate font-mono text-[11px]">{conn.platform_account_id || '—'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggle(conn)}
                        className={clsx('text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
                          conn.enabled
                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        )}
                      >
                        {conn.enabled ? 'Pause' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(conn)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                    {actionError[conn.id] && (
                      <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{actionError[conn.id]}</div>
                    )}
                  </>
                )}

                {/* Not connected — show connect button */}
                {!conn && !isExpanded && (
                  <button
                    onClick={() => {
                      if (p.auth === 'oauth') {
                        handleOAuthConnect(p.key)
                      } else {
                        setExpandedPlatform(p.key)
                        setFormData({})
                        setSaveError('')
                      }
                    }}
                    className="btn-primary text-xs w-full justify-center"
                  >
                    {p.auth === 'oauth' ? `Connect with ${p.name}` : `Connect ${p.name}`}
                  </button>
                )}

                {/* Paste-token form (expanded) */}
                {isExpanded && (
                  <>
                    <div className="border-t border-gray-100" />
                    <div className="space-y-3">
                      {p.fields.map(f => (
                        <div key={f.key}>
                          <label className="input-label">{f.label}</label>
                          <input
                            className="input"
                            placeholder={f.placeholder}
                            value={formData[f.key] || ''}
                            onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                          />
                        </div>
                      ))}
                      {saveError && (
                        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{saveError}</div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePasteConnect(p.key)}
                          disabled={saving || !formData.platform_account_id}
                          className={clsx('btn-primary text-xs flex-1 justify-center', (!formData.platform_account_id) && 'opacity-40 cursor-not-allowed')}
                        >
                          {saving ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Save connection'}
                        </button>
                        <button onClick={() => setExpandedPlatform(null)} className="btn-secondary text-xs">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Meta CAPI test console ─────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setShowTestConsole(p => !p)}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={clsx('transition-transform', showTestConsole && 'rotate-90')}>
              <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Meta CAPI test console
          </button>

          {showTestConsole && (
            <div className="card mt-3 space-y-4">
              <p className="text-xs text-gray-400">Send a test event directly to Meta's Conversions API to verify your credentials work.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Pixel ID</label>
                  <input className="input" placeholder="123456789012345" value={testCreds.pixel_id} onChange={e => setTestCreds(p => ({ ...p, pixel_id: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Test Event Code</label>
                  <input className="input" placeholder="TEST12345 (optional)" value={testCreds.test_event_code} onChange={e => setTestCreds(p => ({ ...p, test_event_code: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="input-label">Access Token</label>
                <input className="input" placeholder="EAAG..." value={testCreds.access_token} onChange={e => setTestCreds(p => ({ ...p, access_token: e.target.value }))} />
              </div>
              <button
                onClick={handleMetaTestEvent}
                disabled={testLoading || !testCreds.pixel_id || !testCreds.access_token}
                className={clsx('btn-primary text-xs', (!testCreds.pixel_id || !testCreds.access_token) && 'opacity-40 cursor-not-allowed')}
              >
                {testLoading ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Send test PageView'}
              </button>

              {testResult && (
                <div className={clsx('rounded-xl border p-4', testResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200')}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {testResult.success ? (
                      <span className="text-emerald-800">Event received</span>
                    ) : (
                      <span className="text-red-800">Event failed</span>
                    )}
                    {testResult.latency_ms && <span className="text-xs font-mono text-gray-500">{testResult.latency_ms}ms</span>}
                  </div>
                  {testResult.match_quality_score !== undefined && (
                    <p className="text-xs text-gray-600 mt-2">Match quality: <strong>{testResult.match_quality_score}/10</strong></p>
                  )}
                  {testResult.error && <p className="text-xs text-red-700 mt-2 font-mono">{testResult.error}</p>}
                  {testResult.event_id && <p className="text-[11px] text-gray-400 mt-2 font-mono">event_id: {testResult.event_id}</p>}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
