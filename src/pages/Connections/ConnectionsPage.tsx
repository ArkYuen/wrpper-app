import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { apiPost } from '../../lib/api'
import type { CapiTestResult } from '../../types'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = 'PageView' | 'Purchase'
type VerifyState = 'idle' | 'loading' | 'ok' | 'error'
type SendState = 'idle' | 'loading' | 'success' | 'error'

interface MetaCredentials {
  pixel_id: string
  access_token: string
  test_event_code: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreDot({ score }: { score: number }) {
  const color =
    score >= 7 ? 'bg-emerald-500' :
    score >= 4 ? 'bg-amber-400' :
    'bg-red-400'
  return <span className={clsx('inline-block w-2 h-2 rounded-full mr-1.5', color)} />
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100
  const color = score >= 7 ? 'bg-emerald-500' : score >= 4 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold tabular-nums w-6">{score}</span>
    </div>
  )
}

function StatusBadge({ state, label }: { state: VerifyState; label?: string }) {
  if (state === 'idle') return null
  if (state === 'loading') return (
    <span className="badge-idle">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
      Checking…
    </span>
  )
  if (state === 'ok') return (
    <span className="badge-live">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {label || 'Token valid'}
    </span>
  )
  return (
    <span className="badge-error">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      {label || 'Failed'}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const [creds, setCreds] = useState<MetaCredentials>({
    pixel_id: '',
    access_token: '',
    test_event_code: '',
  })

  const [verifyState, setVerifyState] = useState<VerifyState>('idle')
  const [verifyLabel, setVerifyLabel] = useState('')

  const [eventType, setEventType] = useState<EventType>('PageView')
  const [purchaseValue, setPurchaseValue] = useState('29.99')
  const [currency, setCurrency] = useState('USD')
  const [sendState, setSendState] = useState<SendState>('idle')

  const [result, setResult] = useState<CapiTestResult | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  const credsFilled = creds.pixel_id.trim() && creds.access_token.trim()

  // ── Verify token ────────────────────────────────────────────────────────────
  async function handleVerify() {
    if (!credsFilled) return
    setVerifyState('loading')
    setResult(null)
    try {
      const res = await apiPost<{ valid: boolean; pixel_name?: string; error?: string }>(
        '/connections/meta/verify',
        { pixel_id: creds.pixel_id, access_token: creds.access_token }
      )
      if (res.valid) {
        setVerifyState('ok')
        setVerifyLabel(res.pixel_name ? `Token valid · ${res.pixel_name}` : 'Token valid')
      } else {
        setVerifyState('error')
        setVerifyLabel(res.error || 'Invalid token or pixel ID')
      }
    } catch (e: unknown) {
      setVerifyState('error')
      setVerifyLabel(e instanceof Error ? e.message : 'Verification failed')
    }
  }

  // ── Send test event ─────────────────────────────────────────────────────────
  async function handleSendEvent() {
    if (!credsFilled) return
    setSendState('loading')
    setResult(null)
    try {
      const payload = {
        pixel_id: creds.pixel_id,
        access_token: creds.access_token,
        event_name: eventType,
        test_event_code: creds.test_event_code || undefined,
        ...(eventType === 'Purchase' ? { value: parseFloat(purchaseValue), currency } : {}),
      }
      const res = await apiPost<CapiTestResult>('/connections/meta/test-event', payload)
      setResult(res)
      setSendState(res.success ? 'success' : 'error')
    } catch (e: unknown) {
      setResult({ success: false, event_id: '', error: e instanceof Error ? e.message : 'Unknown error' })
      setSendState('error')
    }
  }

  // ── Save connection ─────────────────────────────────────────────────────────
  async function handleSave() {
    if (!credsFilled || verifyState !== 'ok') return
    try {
      await apiPost('/connections', {
        platform: 'meta',
        pixel_id: creds.pixel_id,
        access_token: creds.access_token,
      })
      alert('Meta CAPI connection saved.')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Platform Connections"
        description="Connect your ad platforms to enable server-side CAPI attribution."
      />

      <div className="px-6 pb-10 space-y-6 max-w-3xl">

        {/* ── Meta CAPI card ─────────────────────────────────────────────── */}
        <section className="card space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Meta Conversions API</h2>
                <p className="text-xs text-gray-400">Server-side event forwarding to Meta Pixel</p>
              </div>
            </div>
            <StatusBadge state={verifyState} label={verifyLabel} />
          </div>

          <div className="border-t border-gray-100" />

          {/* Credentials */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Credentials</h3>

            <div>
              <label className="input-label">Pixel ID</label>
              <input
                className="input"
                placeholder="Enter your Meta Pixel ID"
                value={creds.pixel_id}
                onChange={e => setCreds(p => ({ ...p, pixel_id: e.target.value }))}
              />
            </div>

            <div>
              <label className="input-label">Access Token</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type="password"
                  placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={creds.access_token}
                  onChange={e => setCreds(p => ({ ...p, access_token: e.target.value }))}
                />
                <svg className="absolute right-3 top-2.5 text-gray-300" width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Generate from Meta Business Manager → Data Sources → Pixels → Settings → Conversions API
              </p>
            </div>

            <div>
              <label className="input-label">Test Event Code <span className="normal-case font-normal text-gray-400">(optional)</span></label>
              <input
                className="input"
                placeholder="TEST12345"
                value={creds.test_event_code}
                onChange={e => setCreds(p => ({ ...p, test_event_code: e.target.value }))}
              />
              <p className="mt-1 text-xs text-gray-400">
                From Meta Events Manager → Test Events tab. Lets you see events in real time without affecting production data.
              </p>
            </div>
          </div>

          {/* Verify */}
          <div className="flex items-center gap-3 pt-1">
            <button
              className={clsx('btn-secondary', !credsFilled && 'opacity-40 cursor-not-allowed')}
              onClick={handleVerify}
              disabled={!credsFilled || verifyState === 'loading'}
            >
              {verifyState === 'loading' ? (
                <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              Verify token
            </button>

            <button
              className={clsx('btn-primary', (verifyState !== 'ok') && 'opacity-40 cursor-not-allowed')}
              onClick={handleSave}
              disabled={verifyState !== 'ok'}
            >
              Save connection
            </button>
          </div>
        </section>

        {/* ── Test event sender ──────────────────────────────────────────── */}
        <section className="card space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Test Event Console</h2>
            <p className="text-xs text-gray-400 mt-0.5">Send test events and inspect Meta's match quality score response</p>
          </div>

          <div className="border-t border-gray-100" />

          {/* Event type selector */}
          <div>
            <label className="input-label">Event type</label>
            <div className="flex gap-2">
              {(['PageView', 'Purchase'] as EventType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setEventType(type)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                    eventType === type
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Purchase fields */}
          {eventType === 'Purchase' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Value</label>
                <input
                  className="input"
                  placeholder="29.99"
                  value={purchaseValue}
                  onChange={e => setPurchaseValue(e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">Currency</label>
                <select
                  className="input"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                >
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Send button */}
          <button
            className={clsx('btn-primary w-full justify-center', !credsFilled && 'opacity-40 cursor-not-allowed')}
            onClick={handleSendEvent}
            disabled={!credsFilled || sendState === 'loading'}
          >
            {sendState === 'loading' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7l12-6-6 12-1.5-5.5L1 7z" fill="currentColor" opacity=".8"/>
                </svg>
                Send {eventType} event
              </>
            )}
          </button>

          {/* Results panel */}
          {result && (
            <div className={clsx(
              'rounded-xl border p-4 space-y-4',
              result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            )}>
              {/* Status row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="#10b981"/>
                        <path d="M5 8l2.5 2.5L11 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm font-semibold text-emerald-800">Event received</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill="#ef4444"/>
                        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span className="text-sm font-semibold text-red-800">Event failed</span>
                    </>
                  )}
                </div>
                {result.latency_ms && (
                  <span className="text-xs text-gray-500 font-mono">{result.latency_ms}ms</span>
                )}
              </div>

              {/* Match quality score */}
              {result.success && result.match_quality_score !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Event Match Quality</span>
                    <span className={clsx(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      result.match_quality_score >= 7 ? 'bg-emerald-100 text-emerald-700' :
                      result.match_quality_score >= 4 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {result.match_quality_score >= 7 ? 'Excellent' :
                       result.match_quality_score >= 4 ? 'Good' : 'Low'}
                    </span>
                  </div>
                  <ScoreBar score={result.match_quality_score} />
                  <p className="text-xs text-gray-400">
                    Score of <strong className="text-gray-700">{result.match_quality_score}/10</strong> — higher scores improve ad delivery and attribution accuracy.
                    {result.match_quality_score < 7 && ' Add more customer parameters (email, phone) to improve this score.'}
                  </p>
                </div>
              )}

              {/* Diagnostics */}
              {result.match_quality_diagnostics && Object.keys(result.match_quality_diagnostics).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Signal diagnostics</p>
                  {Object.entries(result.match_quality_diagnostics).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className={clsx(
                        'font-medium px-1.5 py-0.5 rounded',
                        val === 'provided' ? 'bg-emerald-100 text-emerald-700' :
                        val === 'hashed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      )}>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Key IDs */}
              {result.success && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {result.event_id && (
                    <div>
                      <p className="text-gray-400 mb-0.5">event_id</p>
                      <code className="font-mono text-gray-700 bg-white px-1.5 py-0.5 rounded border border-emerald-100 text-[11px] break-all">
                        {result.event_id}
                      </code>
                    </div>
                  )}
                  {result.fbtrace_id && (
                    <div>
                      <p className="text-gray-400 mb-0.5">fbtrace_id</p>
                      <code className="font-mono text-gray-700 bg-white px-1.5 py-0.5 rounded border border-emerald-100 text-[11px] break-all">
                        {result.fbtrace_id}
                      </code>
                    </div>
                  )}
                </div>
              )}

              {/* Error message */}
              {!result.success && result.error && (
                <p className="text-sm text-red-700 font-mono bg-red-100 rounded-lg p-3">{result.error}</p>
              )}

              {/* Raw toggle */}
              {result.raw_response && (
                <div>
                  <button
                    onClick={() => setShowRaw(p => !p)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                      className={clsx('transition-transform', showRaw && 'rotate-90')}>
                      <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {showRaw ? 'Hide' : 'Show'} raw response
                  </button>
                  {showRaw && (
                    <pre className="mt-2 text-[11px] font-mono bg-gray-900 text-green-300 rounded-lg p-3 overflow-x-auto leading-relaxed">
                      {JSON.stringify(result.raw_response, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Other platforms (coming soon) ──────────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Other platforms</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'TikTok Events API', color: 'bg-purple-50 border-purple-100', icon: '📱' },
              { name: 'Google Ads', color: 'bg-green-50 border-green-100', icon: '🎯' },
              { name: 'LinkedIn CAPI', color: 'bg-blue-50 border-blue-100', icon: '💼' },
            ].map(p => (
              <div key={p.name} className={clsx('rounded-xl border p-4 opacity-60', p.color)}>
                <div className="text-lg mb-2">{p.icon}</div>
                <p className="text-xs font-medium text-gray-700">{p.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Coming soon</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
