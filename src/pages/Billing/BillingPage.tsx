import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { apiFetch, apiPost } from '../../lib/api'
import type { BillingStatus } from '../../types'

const PLANS = [
  {
    key: 'creator',
    name: 'Creator',
    desc: 'For individual creators and small brands.',
    monthlyLabel: '$49/mo',
    annualLabel: '$39/mo',
    annualNote: 'Billed annually ($468)',
  },
  {
    key: 'agency',
    name: 'Agency',
    desc: 'For agencies managing multiple brands.',
    monthlyLabel: '$199/mo',
    annualLabel: '$159/mo',
    annualNote: 'Billed annually ($1,908)',
  },
]

function formatPlan(plan: string | null): string {
  if (!plan) return 'Unknown'
  return plan
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function BillingPage() {
  const { org } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [annual, setAnnual] = useState(false)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('billing') === 'success') {
      setShowSuccess(true)
      setSearchParams({}, { replace: true })
      const t = setTimeout(() => setShowSuccess(false), 5000)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (!org) return
    apiFetch<BillingStatus>('/v1/billing/status')
      .then(setBilling)
      .catch(() => setError('Failed to load billing status'))
      .finally(() => setLoading(false))
  }, [org])

  async function handleSubscribe(planKey: string) {
    const plan = annual ? `${planKey}_annual` : planKey
    setSubscribing(plan)
    try {
      const { url } = await apiPost<{ url: string }>('/v1/billing/checkout-session', { plan })
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start checkout')
      setSubscribing(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const { url } = await apiPost<{ url: string }>('/v1/billing/portal-session', {})
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open billing portal')
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hasSubscription = billing?.subscription_status === 'active' || billing?.subscription_status === 'past_due'

  return (
    <div className="min-h-screen">
      <PageHeader title="Billing" description="Manage your subscription and billing." />

      <div className="px-6 pb-10 max-w-2xl space-y-6">

        {/* Success banner */}
        {showSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Subscription activated. Welcome to Wrpper.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Active subscription */}
        {hasSubscription && billing && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Current Plan</h2>
              <span className={billing.subscription_status === 'active' ? 'badge-live' : 'badge-warn'}>
                {billing.subscription_status === 'active' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
                {billing.subscription_status === 'active' ? 'Active' : 'Past Due'}
              </span>
            </div>
            <div className="border-t border-gray-100" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Plan</p>
                <p className="text-gray-700 font-medium">{formatPlan(billing.subscription_plan)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Current period ends</p>
                <p className="text-gray-700">{formatDate(billing.current_period_end)}</p>
              </div>
            </div>
            <div className="border-t border-gray-100" />
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="btn-secondary text-xs"
            >
              {portalLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 6h12M2 10h12M5 2v12M11 2v12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              )}
              Manage Billing
            </button>
          </div>
        )}

        {/* Plan selection (no subscription or canceled) */}
        {!hasSubscription && (
          <>
            {/* Interval toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm ${!annual ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>Monthly</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative w-10 h-5 rounded-full transition-colors ${annual ? 'bg-brand-600' : 'bg-gray-200'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${annual ? 'translate-x-5' : ''}`}
                />
              </button>
              <span className={`text-sm ${annual ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>Annual</span>
              {annual && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 tracking-wide">
                  SAVE 20%
                </span>
              )}
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-2 gap-4">
              {PLANS.map((plan) => {
                const planId = annual ? `${plan.key}_annual` : plan.key
                const isLoading = subscribing === planId
                return (
                  <div key={plan.key} className="card space-y-4 flex flex-col">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{plan.desc}</p>
                    </div>
                    <div className="border-t border-gray-100" />
                    <div>
                      <span className="text-2xl font-semibold text-gray-900">
                        {annual ? plan.annualLabel : plan.monthlyLabel}
                      </span>
                      {annual && (
                        <p className="text-xs text-gray-400 mt-0.5">{plan.annualNote}</p>
                      )}
                    </div>
                    <div className="flex-1" />
                    <button
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={!!subscribing}
                      className="btn-primary w-full justify-center"
                    >
                      {isLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Subscribe'
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Canceled state — show plan selection with message */}
        {billing?.subscription_status === 'canceled' && (
          <div className="card">
            <p className="text-sm text-gray-500">
              Your subscription has been canceled. Choose a plan below to resubscribe.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
