export type Platform = 'meta' | 'tiktok' | 'google' | 'linkedin' | 'reddit' | 'pinterest' | 'snap'

export type ConnectionStatus = 'live' | 'expiring' | 'expired' | 'disconnected'

export interface PlatformConnection {
  id: string
  platform: Platform
  status: ConnectionStatus
  pixel_id: string
  token_expires_at: string | null
  events_sent: number
  match_rate: number
  last_verified_at: string | null
}

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

export interface AttributionEvent {
  id: string
  timestamp: string
  platform: Platform
  influencer_id: string
  event_name: string
  click_count: number
  is_deduped: boolean
  match_score: number
  value?: number
  currency?: string
}

export interface InfluencerStat {
  influencer_id: string
  display_name?: string
  handle?: string
  platform: Platform
  clicks: number
  conversions: number
  revenue: number
  avg_match_score: number
}

export interface DashboardSummary {
  total_clicks: number
  total_conversions: number
  dedup_rate: number
  active_influencers: number
  clicks_delta: number
  conversions_delta: number
}
