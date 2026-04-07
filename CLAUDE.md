# CLAUDE.md — Wrpper Frontend (app.wrpper.com)

This file is the standing context for every Claude Code session on this codebase.
Read it in full before doing anything.

---

## What This Is

The React dashboard for **Wrpper** — a server-side CAPI attribution platform for
influencer marketing. The backend (FastAPI at `api.wrpper.com`, repo: `ArkYuen/wrpper`)
is fully built. This frontend is deployed at `app.wrpper.com`.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | React 18 + TypeScript |
| Router | react-router-dom v6 |
| Styling | Tailwind CSS 3.4 |
| Auth | Supabase Auth (@supabase/supabase-js 2.39) |
| Charts | Recharts 2.10 (installed, not yet used) |
| Build | Vite 5 |
| API | `https://api.wrpper.com` |

Brand color: purple `#6d38e0`. Font: Inter + JetBrains Mono.

---

## Env Variables

```
VITE_SUPABASE_URL=https://rsxxfkbnlrxxnqcnxblz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_BASE_URL=https://api.wrpper.com
```

---

## Auth Flow (DONE — do not rebuild)

1. `supabase.auth.signInWithPassword()` or `signInWithOAuth({ provider: 'google' })`
2. Supabase returns session with `access_token`
3. `src/lib/api.ts` auto-injects `Authorization: Bearer <token>` on every API call
4. Backend validates JWT, auto-creates Organization + User on first login
5. `AuthContext` fetches `/v1/dashboard/me` to get `org_id`, stores it in context
6. `AppLayout` checks `useAuth().session` — redirects to `/signin` if null

---

## File Structure

```
src/
├── App.tsx                    # Routes
├── main.tsx                   # Entry point
├── index.css                  # Tailwind + global styles
├── context/
│   └── AuthContext.tsx         # Session + org state, Google OAuth
├── lib/
│   ├── api.ts                 # apiFetch, apiPost, apiDelete with auth
│   └── supabase.ts            # Supabase client
├── components/
│   ├── AppLayout.tsx           # Protected route wrapper (sidebar + outlet)
│   ├── Sidebar.tsx             # Nav sidebar with 5 links
│   └── PageHeader.tsx          # Reusable page header
├── pages/
│   ├── AuthPages/
│   │   ├── SignInPage.tsx      # Email + Google OAuth
│   │   ├── SignUpPage.tsx      # Email + Google OAuth
│   │   └── ResetPasswordPage.tsx
│   ├── Dashboard/
│   │   └── DashboardPage.tsx   # KPIs, CAPI strip, conversion breakdown
│   ├── Connections/
│   │   └── ConnectionsPage.tsx # 7-platform grid, OAuth + paste-token, test console
│   ├── Analytics/
│   │   └── AnalyticsPage.tsx   # Click events table with pagination
│   ├── Influencers/
│   │   └── InfluencersPage.tsx # Creator leaderboard
│   └── Settings/
│       └── SettingsPage.tsx    # Account, org, pub key, pixel snippet
└── types/
    └── index.ts               # API response types
```

---

## What's DONE (do not rebuild)

Every core page is wired to live API data. Do NOT replace with mock data.

| Page | API Endpoints Used | Status |
|---|---|---|
| **SignInPage** | Supabase Auth (email + Google OAuth) | LIVE |
| **SignUpPage** | Supabase Auth (email + Google OAuth) | LIVE |
| **ResetPasswordPage** | Supabase `resetPasswordForEmail()` | LIVE |
| **DashboardPage** | `/v1/dashboard/summary`, `/v1/dashboard/conversions`, `/v1/orgs/{id}/connections` | LIVE |
| **ConnectionsPage** | `/v1/orgs/{id}/connections`, `/v1/orgs/{id}/connections/token`, toggle, delete, OAuth redirects, Meta test console | LIVE |
| **AnalyticsPage** | `/v1/dashboard/clicks?page=&per_page=50` with pagination | LIVE |
| **InfluencersPage** | `/v1/dashboard/creators?days=30` | LIVE |
| **SettingsPage** | `/v1/dashboard/me`, `/v1/dashboard/publishable-key`, `/v1/dashboard/pixel-snippet` | LIVE |

**AuthContext** stores `org.id`, `org.name`, `org.slug` from `/v1/dashboard/me`.
All pages use this for org-scoped API calls.

---

## API Client

`src/lib/api.ts` provides:
- `apiFetch<T>(path)` — GET with Bearer token
- `apiPost<T>(path, body)` — POST with Bearer token
- `apiDelete(path)` — DELETE with Bearer token

Base URL from `VITE_API_BASE_URL`. Auth token auto-injected from Supabase session.

---

## Design Rules

- Tailwind only — no CSS modules, no external CSS
- Existing CSS classes: `card`, `btn-primary`, `btn-secondary`, `btn-danger`, `input`, `input-label`, `badge-live`, `badge-warn`, `badge-error`, `badge-idle`
- `clsx` for conditional classes
- No emoji in UI — use inline SVGs (see Sidebar.tsx for pattern)
- Monospace for IDs/codes: `font-mono`
- Tables: `text-sm`, `text-xs` headers, thin `border-gray-100` dividers
- Loading spinner: `<span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />`
- Empty states: gray text centered, 1-2 lines, optional CTA
- Error states: `bg-red-50 border border-red-200 rounded-lg text-xs text-red-700`
- Format currency from cents: `(cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })`
- Format dates: `date-fns` — `format(new Date(iso), 'MMM d, h:mm a')`

---

## REMAINING TASKS — in priority order

### TASK 1: Billing / Subscription UI
**Priority: HIGH — users can't subscribe without this**

The backend has Stripe checkout (`POST /v1/billing/checkout-session`) and status
(`GET /v1/billing/status`). The frontend needs a way to:

**What to do:**
1. Create `src/pages/Billing/BillingPage.tsx` (or add a section to SettingsPage)
2. Show current subscription status from `GET /v1/billing/status`:
   - Plan name, status (active/past_due/canceled/trialing), current period end
   - If no subscription: show plan selection cards
3. Plan selection:
   - Creator plan (monthly/annual) and Agency plan (monthly/annual)
   - "Subscribe" button calls `POST /v1/billing/checkout-session` with `{ plan: "creator", interval: "monthly" }`
   - Backend returns `{ checkout_url }` → redirect user to Stripe Checkout
4. After checkout, Stripe redirects back to `app.wrpper.com/settings?billing=success`
5. Add "Manage Billing" button that opens Stripe Customer Portal (if backend supports it)
6. Add route in `App.tsx`: `/billing` or nest under `/settings`
7. Add nav link in `Sidebar.tsx`

**Files:** New page, `App.tsx`, `Sidebar.tsx`, `types/index.ts`

---

### TASK 2: Link Builder / Wrapped Link Creation
**Priority: HIGH — core product feature, not yet in frontend**

The backend has `POST /v1/links` and `POST /v1/links/quick` for creating wrapped
links. The frontend has no UI for this.

**What to do:**
1. Create `src/pages/Links/LinksPage.tsx`
2. List existing links from `GET /v1/links` (if endpoint exists) or build into dashboard
3. "Create Link" form:
   - Creator handle (text input)
   - Campaign slug (text input)
   - Destination URL (text input, required)
   - Optional: asset slug, deep link overrides, UTM overrides
4. Submit to `POST /v1/links/quick` (simpler) or `POST /v1/links`:
   ```json
   {
     "creator_handle": "...",
     "campaign_slug": "...",
     "destination_url": "https://...",
   }
   ```
5. On success, show the wrapped link: `https://api.wrpper.com/c/{creator}/{campaign}`
6. Copy-to-clipboard button for the generated link
7. Add route `/links` in `App.tsx` and nav link in `Sidebar.tsx`

**Files:** New page, `App.tsx`, `Sidebar.tsx`, `types/index.ts`

---

### TASK 3: Charts / Data Visualization
**Priority: MEDIUM — Recharts is installed but unused**

`recharts` is in `package.json` but no charts are rendered. The dashboard shows
KPI cards and tables but no visual trends.

**What to do:**
1. Add a clicks-over-time line chart to `DashboardPage.tsx`:
   - Backend may need a timeseries endpoint (`/v1/dashboard/clicks-timeseries?days=30`)
   - If it doesn't exist, group the paginated clicks data client-side by day
   - Use `<LineChart>` from recharts with brand purple stroke
2. Add a platform breakdown pie/bar chart:
   - Data from `/v1/dashboard/platforms?days=30` (if endpoint exists)
   - Or from `/v1/dashboard/sources` (already called on dashboard)
3. Add a conversion funnel visualization:
   - Clicks → Sessions → Conversions → Revenue
   - Data already available from summary + conversions endpoints
4. Style charts to match brand (purple palette, Inter font, dark text)

**Files:** `DashboardPage.tsx`, potentially `AnalyticsPage.tsx`

---

### TASK 4: Date Range Selector
**Priority: MEDIUM — currently hardcoded to 30 days**

All dashboard/analytics API calls use `?days=30`. Users should be able to pick
different time ranges.

**What to do:**
1. Create a reusable `<DateRangeSelector>` component with options:
   - 7 days, 14 days, 30 days (default), 90 days, All time
   - Optional: custom date range picker
2. Store selected range in state (or URL query params for shareability)
3. Pass `days` param to all dashboard API calls
4. Apply to: DashboardPage, AnalyticsPage, InfluencersPage
5. Keep it simple — a dropdown/button group, not a full calendar widget

**Files:** New component, `DashboardPage.tsx`, `AnalyticsPage.tsx`, `InfluencersPage.tsx`

---

### TASK 5: Team / Member Management
**Priority: LOW — single-user works for now**

The backend supports org membership with roles (owner/admin/member). The frontend
has no team management UI.

**What to do:**
1. Create `src/pages/Team/TeamPage.tsx` (or section in Settings)
2. List org members from backend (endpoint TBD — may need backend work first)
3. Invite member form (email + role)
4. Role management (change role, remove member)
5. Backend endpoints needed:
   - `GET /v1/orgs/{org_id}/members`
   - `POST /v1/orgs/{org_id}/members/invite`
   - `PATCH /v1/orgs/{org_id}/members/{user_id}`
   - `DELETE /v1/orgs/{org_id}/members/{user_id}`
6. **Check if these backend endpoints exist first** — if not, this is blocked on backend work

**Files:** New page, `App.tsx`, `Sidebar.tsx`

---

### TASK 6: Error Handling & Loading States Polish
**Priority: LOW — works but rough edges**

Some pages have `.catch(() => {})` or minimal error handling.

**What to do:**
1. Audit all pages for silent error swallowing
2. Add user-visible error states using the existing error pattern:
   `bg-red-50 border border-red-200 rounded-lg text-xs text-red-700`
3. Add retry buttons on failed API calls where appropriate
4. Ensure all loading states use the standard spinner pattern
5. Add a global error boundary component

**Files:** All page files

---

## Code Conventions

- Functional components only, no class components
- `useState` + `useEffect` for data fetching (no React Query)
- Type all API responses in `src/types/index.ts`
- Error handling: try/catch in async handlers, display in component state
- No `console.log` in committed code
- Prefer early returns over nested ternaries

---

## Testing Locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # Must pass with zero TS errors
```

---

## CORS

Backend allows: `localhost:3000`, `localhost:5173`, `app.wrpper.com`.
Update backend CORS if using a different local port.

---

## Companion Repo

The backend lives at `github.com/ArkYuen/wrpper` (private). It has its own CLAUDE.md
with backend-specific tasks. Some frontend tasks (billing UI, team management) may
require new backend endpoints — check that repo first.
