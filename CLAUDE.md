# CLAUDE.md — Wrpper Frontend (app.wrpper.com)

This file is the standing context for every Claude Code session on this codebase.
Read it in full before doing anything.

---

## What This Is

The React dashboard for **Wrpper** — a server-side CAPI attribution platform for
influencer marketing. Advertisers use this dashboard to:

1. **Connect ad platforms** (Meta, TikTok, LinkedIn, Snapchat, Reddit, Pinterest, GA4)
2. **View attribution data** — clicks, conversions, revenue, per-creator performance
3. **Manage links** — create wrapped links for creators
4. **Install the pixel** — get wrp.js snippet for their site

The backend (FastAPI at `api.wrpper.com`) is fully built. This frontend needs to be
wired to it. Most pages currently have hardcoded mock data.

---

## Stack

| Layer        | Tech                              |
|--------------|-----------------------------------|
| Framework    | React 18 + TypeScript             |
| Router       | react-router-dom v6               |
| Styling      | Tailwind CSS 3.4                  |
| Auth         | Supabase Auth (@supabase/supabase-js) |
| Charts       | Recharts 2.10                     |
| Build        | Vite 5                            |
| Deploy       | Vercel (or Railway static)        |
| API          | `https://api.wrpper.com`          |

Brand color is purple — `brand-600: #6d38e0`. Font is Inter + JetBrains Mono.

---

## Env Variables

```
VITE_SUPABASE_URL=https://rsxxfkbnlrxxnqcnxblz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzeHhma2JubHJ4eG5xY254Ymx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NTE4MzgsImV4cCI6MjA4NjQyNzgzOH0.9LGRAI7IwvjTbnUThxKjvZI6M9PjRTDqKNEy2mWavCQ
VITE_API_BASE_URL=https://api.wrpper.com
```

---

## Auth Flow

Supabase handles auth. The backend validates the JWT server-side.

1. `supabase.auth.signInWithPassword()` or `supabase.auth.signInWithOAuth()`
2. Supabase returns a session with `access_token`
3. Every API call includes `Authorization: Bearer <access_token>` (handled by `src/lib/api.ts`)
4. Backend validates token with Supabase, auto-creates Organization + User on first login
5. `AppLayout` checks `useAuth().session` — if null, redirects to `/signin`

**The `organization_id` is needed for most API calls.** Get it from `GET /v1/dashboard/me`:
```json
{
  "user": { "id": "...", "email": "...", "full_name": "..." },
  "organization": { "id": "uuid-here", "name": "...", "slug": "..." }
}
```

Store `organization_id` in AuthContext or a dedicated hook so it's available everywhere.

---

## Design Rules

- Use existing CSS classes: `card`, `btn-primary`, `btn-secondary`, `btn-danger`, `input`, `input-label`, `badge-live`, `badge-warn`, `badge-error`, `badge-idle`
- Tailwind only — no external CSS. No CSS modules.
- `clsx` for conditional classes (already installed)
- No emoji in UI — use inline SVGs (look at Sidebar.tsx for the pattern)
- Monospace for IDs, codes, technical values: `font-mono`
- Tables: `text-sm`, `text-xs` headers, thin `border-gray-100` dividers
- Loading spinner pattern: `<span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />`
- Empty states: gray text centered, 1-2 lines, optional CTA button
- Error states: `bg-red-50 border border-red-200 rounded-lg text-xs text-red-700`

---

## API Client

`src/lib/api.ts` provides:
- `apiFetch<T>(path, options)` — GET with auth headers
- `apiPost<T>(path, body)` — POST with auth headers
- `apiDelete(path)` — DELETE with auth headers

All paths are relative to `VITE_API_BASE_URL` (default `https://api.wrpper.com`).

---

## TASK 1: Wire Dashboard to Live Data

**File:** `src/pages/Dashboard/DashboardPage.tsx`

Currently all hardcoded. Replace with live API calls.

### Backend Endpoints (all require Bearer token)

**GET /v1/dashboard/me**
```json
{
  "user": { "id": "", "email": "", "full_name": "" },
  "organization": { "id": "org-uuid", "name": "Acme", "slug": "org-abc123" }
}
```

**GET /v1/dashboard/summary?days=30**
```json
{
  "total_clicks": 1204,
  "bots_filtered": 31,
  "unique_visitors": 892,
  "pct_change": 18.3,
  "period_days": 30
}
```

**GET /v1/dashboard/conversions?days=30**
```json
{
  "total_clicks": 1204,
  "total_conversions": 84,
  "total_revenue_cents": 412300,
  "total_refunds": 2,
  "total_refund_cents": 5999,
  "net_revenue_cents": 406301,
  "conversion_rate": 6.97,
  "refund_rate": 2.38,
  "by_type": [
    { "event_type": "purchase", "count": 60, "revenue_cents": 380000 },
    { "event_type": "add_to_cart", "count": 24, "revenue_cents": 32300 }
  ],
  "period_days": 30
}
```

**GET /v1/dashboard/platforms?days=30**
Returns `[{ "source_platform": "tiktok", "count": 500 }, ...]`

**GET /v1/dashboard/devices?days=30**
Returns `[{ "device_class": "mobile", "count": 800 }, ...]`

**GET /v1/dashboard/creators?days=30**
Returns per-creator stats with clicks, conversions, revenue, refunds.

**GET /v1/dashboard/clicks?page=1&per_page=50**
Paginated click events table.

### Implementation Notes

- Fetch on mount with `useEffect`. Show loading spinner while fetching.
- CAPI health strip: replace mocks with `GET /v1/orgs/{org_id}/connections` (see Task 2). Show real connection status, `total_events_fired`, `enabled` state.
- KPI row: map from `/summary` + `/conversions` responses.
- Revenue display: backend returns cents — divide by 100 and format as currency.
- Empty state: if no clicks yet, show setup CTA pointing to Settings (pixel install).

---

## TASK 2: Connections UI — All Platforms

**File:** `src/pages/Connections/ConnectionsPage.tsx`

Currently only a Meta test console. Rebuild as a full multi-platform connections manager.

### Backend Endpoints

**GET /v1/orgs/{org_id}/connections**
Returns array of `ConnectionOut`:
```json
{
  "id": "uuid",
  "platform": "meta",
  "status": "active",
  "auth_type": "token",
  "platform_account_id": "pixel-id-here",
  "platform_account_label": "My Meta Pixel",
  "secondary_id": "test-event-code",
  "enabled": true,
  "total_events_fired": 14302,
  "last_event_at": "2026-03-23T...",
  "last_event_status": "success",
  "token_expires_at": null,
  "refresh_fail_count": 0,
  "created_at": "2026-03-01T..."
}
```

**POST /v1/orgs/{org_id}/connections/token** (paste-token platforms: meta, snapchat, reddit, pinterest)
```json
{
  "platform": "meta",
  "platform_account_id": "pixel-id",
  "platform_account_label": "My Pixel",
  "secondary_id": "test_event_code_or_api_secret"
}
```

**PATCH /v1/orgs/{org_id}/connections/{id}/toggle** — toggles `enabled`

**DELETE /v1/orgs/{org_id}/connections/{id}** — disconnects

**OAuth platforms** (tiktok, linkedin, google):
- Redirect user to: `GET /v1/oauth/{platform}/connect?org_id={org_id}`
- Backend handles the full OAuth dance and redirects back
- After OAuth callback, connection appears in the list

**POST /connections/meta/verify** — verify Meta token (existing)
**POST /connections/meta/test-event** — send test event (existing)

### UI Design

Build a **platform grid** at the top showing all 7 platforms as cards:

| Platform  | Auth Type  | Credential Fields                                    |
|-----------|-----------|------------------------------------------------------|
| Meta      | paste     | Pixel ID + Access Token + Test Event Code (optional) |
| TikTok    | oauth     | → redirects to TikTok auth                           |
| LinkedIn  | oauth     | → redirects to LinkedIn auth                         |
| Google    | oauth     | → redirects to Google auth (GA4 + Ads)               |
| Snapchat  | paste     | Pixel ID + Access Token                              |
| Reddit    | paste     | Pixel ID + Access Token                              |
| Pinterest | paste     | Ad Account ID + Access Token                         |

Each platform card shows:
- Platform name + icon
- Status badge (live / disconnected / expiring)
- Events fired count
- Connect / Disconnect button
- Enable/disable toggle (for connected platforms)

When "Connect" is clicked on a **paste-token** platform:
- Expand or modal with credential input fields
- Verify button (for Meta, use existing /verify endpoint)
- Save button → POST to `/v1/orgs/{org_id}/connections/token`

When "Connect" is clicked on an **OAuth** platform:
- `window.location.href = API + '/v1/oauth/{platform}/connect?org_id=' + orgId`
- User completes OAuth externally, gets redirected back
- On return, re-fetch connections list to see the new connection

Keep the existing **Meta CAPI test console** as a collapsible section below the grid —
it's useful for debugging.

### Platform Visual Config
```ts
const PLATFORMS = {
  meta:      { name: 'Meta',      color: 'blue',   auth: 'paste' },
  tiktok:    { name: 'TikTok',    color: 'purple', auth: 'oauth' },
  linkedin:  { name: 'LinkedIn',  color: 'blue',   auth: 'oauth' },
  google:    { name: 'Google',    color: 'green',  auth: 'oauth' },
  snapchat:  { name: 'Snapchat',  color: 'amber',  auth: 'paste' },
  reddit:    { name: 'Reddit',    color: 'coral',  auth: 'paste' },
  pinterest: { name: 'Pinterest', color: 'red',    auth: 'paste' },
}
```

---

## TASK 3: Auth Flow Polish

### 3a. Store org_id globally

Create `src/hooks/useOrg.ts` or extend `AuthContext` to:
1. After login, call `GET /v1/dashboard/me`
2. Store `organization_id` and `organization_name` in context
3. Expose via `useOrg()` hook
4. All pages that need `org_id` use this hook instead of hardcoding

### 3b. Google OAuth Sign-In (Supabase)

In `SignInPage.tsx` and `SignUpPage.tsx`, add a "Continue with Google" button:

```ts
async function handleGoogleSignIn() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
  if (error) setError(error.message)
}
```

This is Supabase-side Google OAuth for *sign-in*. It's separate from the Google OAuth
in Connections (which connects the advertiser's Google Ads/GA4 account for CAPI).

### 3c. Sign-in page improvements

- Add "Continue with Google" divider + button above the email form
- Add "Forgot password?" link (use `supabase.auth.resetPasswordForEmail()`)
- After signup, if email confirmation is required, show a check-your-email state (already exists)

### 3d. Password reset page

Create `src/pages/AuthPages/ResetPasswordPage.tsx`:
- Input for email
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/signin' })`
- Shows success state

Add route in `App.tsx`: `<Route path="reset-password" element={<ResetPasswordPage />} />`

---

## TASK 4: Settings Page — Pixel Snippet + API Keys

**File:** `src/pages/Settings/SettingsPage.tsx`

### Wire pixel snippet

Replace the hardcoded snippet with a live call:

**GET /v1/dashboard/pixel-snippet**
```json
{
  "snippet": "<script src=\"https://api.wrpper.com/static/wrp.js\" data-key=\"wrp_pub_org-abc\" data-org=\"org-uuid\"></script>",
  "org_id": "org-uuid",
  "pub_key": "wrp_pub_org-abc",
  "pixel_url": "https://api.wrpper.com/static/wrp.js",
  "instructions": "Add this script tag..."
}
```

Show the snippet in a code block with a "Copy" button.

### Wire user/org data

Use `GET /v1/dashboard/me` to populate account email, user ID, org name.

---

## File Structure After Changes

```
src/
├── App.tsx                         # Add reset-password route
├── context/
│   └── AuthContext.tsx              # Extend with org_id, org_name
├── lib/
│   ├── api.ts                      # No changes needed
│   └── supabase.ts                 # No changes needed
├── hooks/
│   └── useOrg.ts                   # NEW — org context hook (or merge into AuthContext)
├── pages/
│   ├── AuthPages/
│   │   ├── SignInPage.tsx           # Add Google OAuth + forgot password
│   │   ├── SignUpPage.tsx           # Add Google OAuth
│   │   └── ResetPasswordPage.tsx   # NEW
│   ├── Dashboard/
│   │   └── DashboardPage.tsx       # Wire to live API
│   ├── Connections/
│   │   └── ConnectionsPage.tsx     # Full multi-platform rebuild
│   ├── Analytics/
│   │   └── AnalyticsPage.tsx       # Wire to /dashboard/clicks, /platforms, /devices
│   ├── Influencers/
│   │   └── InfluencersPage.tsx     # Wire to /dashboard/creators
│   └── Settings/
│       └── SettingsPage.tsx        # Wire pixel snippet + user data
└── types/
    └── index.ts                    # Add new API response types
```

---

## Execution Order

1. **AuthContext + useOrg** — everything depends on having `org_id`
2. **Dashboard** — most visible, proves the API wiring works
3. **Connections** — biggest feature, unlocks the product
4. **Auth polish** — Google OAuth, reset password
5. **Settings** — pixel snippet, org data

---

## Code Conventions

- Functional components only. No class components.
- `useState` + `useEffect` for data fetching (no React Query — keep it simple).
- Type all API responses in `src/types/index.ts`.
- Error handling: try/catch in async handlers, display in component state.
- Format currency from cents: `(cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })`
- Format dates with `date-fns`: `format(new Date(iso), 'MMM d, h:mm a')`
- Loading states: use the existing spinner pattern inline.
- No `console.log` in committed code.
- Prefer early returns over nested ternaries.

---

## Testing Locally

```bash
npm install
npm run dev
# Opens at http://localhost:5173
# Make sure VITE_ env vars are set in .env
```

Build check:
```bash
npm run build
# Must pass with zero TS errors
```

---

## CORS Note

The backend allows these origins:
- `http://localhost:3000`
- `http://localhost:5173`
- `https://stackfluence.vercel.app`
- `https://app.wrpper.com`

If you're on a different port locally, you may need to update CORS on the backend.
