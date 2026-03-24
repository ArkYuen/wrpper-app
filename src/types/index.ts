export type Platform = 'meta' | 'tiktok' | 'google' | 'linkedin' | 'reddit' | 'pinterest' | 'snapchat'

export type ConnectionStatus = 'active' | 'expiring' | 'expired' | 'disconnected'

// --- API response types ---

export interface ApiConnection {
  id: string
  platform: Platform
  status: ConnectionStatus
  auth_type: 'token' | 'oauth'
  platform_account_id: string | null
  platform_account_label: string | null
  secondary_id: string | null
  link_id: string | null
  connected_by: string | null
  connected_at: string | null
  last_event_at: string | null
  last_event_status: string | null
  total_events_fired: number
  enabled: boolean
  token_expires_at: string | null
  refresh_fail_count: number
  created_at: string
}

export interface DashboardMe {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    is_active: boolean
    last_login_at: string | null
    created_at: string | null
  }
  organization: {
    id: string
    name: string
    slug: string
  }
}

export interface DashboardSummary {
  total_clicks: number
  bots_filtered: number
  unique_visitors: number
  pct_change: number | null
  period_days: number
}

export interface DashboardConversions {
  total_clicks: number
  total_conversions: number
  total_revenue_cents: number
  total_refunds: number
  total_refund_cents: number
  net_revenue_cents: number
  conversion_rate: number
  refund_rate: number
  by_type: { event_type: string; count: number; revenue_cents: number }[]
  period_days: number
}

export interface PlatformBreakdown {
  source_platform: string
  count: number
}

export interface DeviceBreakdown {
  device_class: string
  count: number
}

export interface ClickRow {
  click_id: string
  created_at: string
  source_platform: string | null
  source_medium: string | null
  device_class: string | null
  is_mobile: boolean
  country_code: string | null
  risk_score: number
  is_suspected_bot: boolean
  destination_url_final: string
  creator_handle: string | null
  campaign_slug: string | null
}

export interface ClicksResponse {
  clicks: ClickRow[]
  total: number
  page: number
  per_page: number
}

export interface CreatorStat {
  creator_id: string
  handle: string
  display_name: string | null
  total_clicks: number
  total_conversions: number
  total_revenue_cents: number
  total_refunds: number
  total_refund_cents: number
  conversion_rate: number
}

export interface PixelSnippet {
  snippet: string
  org_id: string
  pub_key: string
  pixel_url: string
  instructions: string
}

// --- Legacy types kept for backward compat ---

export interface CapiTestResult {
  success: boolean
  event_id: string
  fbtrace_id?: string
  events_received?: number
  match_quality_score?: number
  match_quality_diagnostics?: Record<string, string>
  raw_response?: unknown
  error?: string
  latency_ms?: number
}

export interface CapiTestPayload {
  pixel_id: string
  access_token: string
  event_name: 'PageView' | 'Purchase'
  test_event_code?: string
  value?: number
  currency?: string
}
