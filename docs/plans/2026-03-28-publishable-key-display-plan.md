# Publishable Key Display — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let dashboard users view and copy their org's publishable API key from the Settings page.

**Architecture:** Add an `encrypted_key` column to the existing `api_keys` table, storing the raw key encrypted with Fernet (same infra used for OAuth tokens). New dashboard endpoint decrypts and returns it. Frontend adds a card to SettingsPage with mask/reveal/copy.

**Tech Stack:** FastAPI, Alembic, SQLAlchemy, Fernet (backend); React, TypeScript, Tailwind CSS (frontend)

---

## Task 1: Alembic Migration — `encrypted_key` Column + Backfill

**Repo:** `wrpper` (backend)

**Files:**
- Create: `alembic/versions/api_key_encrypted_010.py`

**Step 1: Write the migration file**

```python
"""Add encrypted_key column to api_keys and backfill Wrpper org key.

Revision ID: api_key_encrypted_010
Revises: platform_connections_009
Create Date: 2026-03-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

revision = "api_key_encrypted_010"
down_revision = "platform_connections_009"
branch_labels = None
depends_on = None

# Wrpper org's known publishable key (from bootstrap output, stored in CLAUDE.md)
WRPPER_RAW_PUB_KEY = "sf_pub_NZ0L9aZRTwGQjRlqeBJcG1Ku6hNNYTxqEFzPZUzQj70"


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("api_keys")]

    if "encrypted_key" not in columns:
        op.add_column("api_keys", sa.Column("encrypted_key", sa.Text(), nullable=True))

    # Backfill: encrypt the known Wrpper publishable key
    # Import here to avoid circular imports at module level
    import os
    from cryptography.fernet import Fernet

    key = os.environ.get("TOKEN_ENCRYPTION_KEY")
    if key:
        f = Fernet(key.encode())
        encrypted = f.encrypt(WRPPER_RAW_PUB_KEY.encode()).decode()

        conn.execute(
            text(
                """
                UPDATE api_keys
                SET encrypted_key = :enc
                WHERE key_type = 'publishable'
                  AND encrypted_key IS NULL
                  AND key_prefix = :prefix
                """
            ),
            {"enc": encrypted, "prefix": WRPPER_RAW_PUB_KEY[:12]},
        )


def downgrade():
    op.drop_column("api_keys", "encrypted_key")
```

**Step 2: Verify migration chain is correct**

Run: `cd wrpper && alembic heads`
Expected: should show `platform_connections_009` as current head.

**Step 3: Run the migration locally**

Run: `cd wrpper && alembic upgrade head`
Expected: `api_key_encrypted_010` applied successfully, column exists.

**Step 4: Verify the backfill worked**

Run (psql or DB tool):
```sql
SELECT id, key_prefix, key_type, encrypted_key IS NOT NULL AS has_encrypted
FROM api_keys
WHERE key_type = 'publishable';
```
Expected: row with `key_prefix = 'sf_pub_NZ0L9a'`, `has_encrypted = true`.

**Step 5: Commit**

```bash
cd wrpper
git add alembic/versions/api_key_encrypted_010.py
git commit -m "feat: add encrypted_key column to api_keys with backfill"
```

---

## Task 2: Update APIKey Model

**Repo:** `wrpper` (backend)

**Files:**
- Modify: `app/middleware/auth.py` (line 35, after `rate_limit_per_minute`)

**Step 1: Add the column to the SQLAlchemy model**

In `app/middleware/auth.py`, inside the `APIKey` class, add after line 35 (`rate_limit_per_minute`):

```python
    encrypted_key = Column(sa.Text, nullable=True)
```

Also add `import sqlalchemy as sa` at the top if not already present — but `sa` is not imported there currently. Use `from sqlalchemy import Text` instead, adding `Text` to the existing import on line 10:

Change line 10 from:
```python
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean, select, func
```
to:
```python
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean, Text, select, func
```

Then add the column (after `rate_limit_per_minute` on line 35):
```python
    encrypted_key = Column(Text, nullable=True)
```

**Step 2: Verify app starts**

Run: `cd wrpper && uvicorn app.main:app --port 8000`
Expected: starts without import errors. Ctrl+C to stop.

**Step 3: Commit**

```bash
cd wrpper
git add app/middleware/auth.py
git commit -m "feat: add encrypted_key field to APIKey model"
```

---

## Task 3: Update Bootstrap to Store Encrypted Key

**Repo:** `wrpper` (backend)

**Files:**
- Modify: `app/api/admin.py`

**Step 1: Import encrypt_token**

Add to imports (after line 14):
```python
from app.core.encryption import encrypt_token
```

**Step 2: Store encrypted_key on both key rows**

Replace lines 71-86 (the two `db.add(APIKey(...))` blocks) with:

```python
    raw_secret, secret_hash = generate_api_key("secret")
    db.add(APIKey(
        organization_id=org.id,
        key_hash=secret_hash,
        key_prefix=raw_secret[:12],
        key_type="secret",
        name="Default Secret Key",
        encrypted_key=encrypt_token(raw_secret),
    ))

    raw_pub, pub_hash = generate_api_key("publishable")
    db.add(APIKey(
        organization_id=org.id,
        key_hash=pub_hash,
        key_prefix=raw_pub[:12],
        key_type="publishable",
        name="Default Publishable Key",
        encrypted_key=encrypt_token(raw_pub),
    ))
```

**Step 3: Verify app starts**

Run: `cd wrpper && uvicorn app.main:app --port 8000`
Expected: no import errors.

**Step 4: Commit**

```bash
cd wrpper
git add app/api/admin.py
git commit -m "feat: store encrypted raw key on bootstrap"
```

---

## Task 4: New Endpoint — `GET /v1/dashboard/publishable-key`

**Repo:** `wrpper` (backend)

**Files:**
- Modify: `app/api/dashboard.py` (append to end of file)

**Step 1: Add the endpoint**

Append to the bottom of `app/api/dashboard.py`:

```python
# ---------------------------------------------------------------------------
# Publishable key retrieval
# ---------------------------------------------------------------------------

@router.get("/publishable-key")
async def get_publishable_key(
    auth: SupabaseAuthContext = Depends(require_supabase_auth),
    db: AsyncSession = Depends(get_db),
):
    """Return the org's publishable API key (decrypted from storage)."""
    from app.middleware.auth import APIKey
    from app.core.encryption import decrypt_token

    stmt = select(APIKey).where(
        APIKey.organization_id == auth.organization_id,
        APIKey.key_type == "publishable",
        APIKey.is_active == True,
    )
    result = await db.execute(stmt)
    api_key = result.scalar_one_or_none()

    if not api_key:
        return {"key": None, "prefix": None, "created_at": None}

    raw_key = None
    if api_key.encrypted_key:
        try:
            raw_key = decrypt_token(api_key.encrypted_key)
        except Exception:
            pass  # encrypted_key is corrupt or key rotated — return None

    return {
        "key": raw_key,
        "prefix": api_key.key_prefix,
        "created_at": api_key.created_at.isoformat() if api_key.created_at else None,
    }
```

**Step 2: Test the endpoint manually**

Run: `cd wrpper && uvicorn app.main:app --reload --port 8000`

Then curl (replace `<TOKEN>` with a valid Supabase JWT):
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/v1/dashboard/publishable-key
```

Expected:
```json
{"key": "sf_pub_NZ0L9aZRTwGQjRlqeBJcG1Ku6hNNYTxqEFzPZUzQj70", "prefix": "sf_pub_NZ0L9a", "created_at": "2026-..."}
```

**Step 3: Test unauthenticated is rejected**

```bash
curl http://localhost:8000/v1/dashboard/publishable-key
```

Expected: `401 {"detail": "Missing Bearer token"}`

**Step 4: Commit**

```bash
cd wrpper
git add app/api/dashboard.py
git commit -m "feat: add GET /v1/dashboard/publishable-key endpoint"
```

---

## Task 5: Frontend — Publishable Key Card on SettingsPage

**Repo:** `wrpper-app` (frontend)

**Files:**
- Modify: `src/pages/Settings/SettingsPage.tsx`

**Step 1: Add state variables**

After line 11 (`const [copied, setCopied] = useState(false)`), add:

```tsx
  const [pubKey, setPubKey] = useState<{ key: string | null; prefix: string | null } | null>(null)
  const [pubKeyRevealed, setPubKeyRevealed] = useState(false)
  const [pubKeyCopied, setPubKeyCopied] = useState(false)
  const [pubKeyError, setPubKeyError] = useState('')
```

**Step 2: Fetch the publishable key**

Add the publishable key fetch into the existing `Promise.all` on lines 16-19. Change from:

```tsx
    Promise.all([
      apiFetch<DashboardMe>('/v1/dashboard/me'),
      apiFetch<PixelSnippet>('/v1/dashboard/pixel-snippet'),
    ])
      .then(([m, p]) => { setMe(m); setPixel(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
```

to:

```tsx
    Promise.all([
      apiFetch<DashboardMe>('/v1/dashboard/me'),
      apiFetch<PixelSnippet>('/v1/dashboard/pixel-snippet'),
      apiFetch<{ key: string | null; prefix: string | null }>('/v1/dashboard/publishable-key')
        .catch(() => null),
    ])
      .then(([m, p, pk]) => { setMe(m); setPixel(p); if (pk) setPubKey(pk) })
      .catch(() => {})
      .finally(() => setLoading(false))
```

Note: the publishable-key fetch has its own `.catch(() => null)` so a failure there won't block the other data from loading.

**Step 3: Add the copy handler**

After the existing `handleCopy` function (after line 31), add:

```tsx
  function handlePubKeyCopy() {
    if (!pubKey?.key) return
    navigator.clipboard.writeText(pubKey.key).then(() => {
      setPubKeyCopied(true)
      setTimeout(() => setPubKeyCopied(false), 2000)
    })
  }
```

**Step 4: Add the Publishable Key card**

Insert this JSX block after the Organization card's closing `</div>` (after line 89) and before the `{/* wrp.js pixel */}` comment (line 91):

```tsx
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
```

**Step 5: Verify locally**

Run: `cd wrpper-app && npm run dev`
Navigate to Settings page. Confirm:
- Key is masked by default (shows dots)
- Eye icon toggles reveal/hide
- Copy button copies the full key
- "Copied" checkmark shows for 2 seconds

**Step 6: Build check**

Run: `cd wrpper-app && npm run build`
Expected: zero TypeScript errors.

**Step 7: Commit**

```bash
cd wrpper-app
git add src/pages/Settings/SettingsPage.tsx
git commit -m "feat: add publishable key display with mask/reveal/copy to Settings"
```

---

## Task 6: Verify End-to-End

**Step 1: Start backend**

```bash
cd wrpper && uvicorn app.main:app --reload --port 8000
```

**Step 2: Start frontend**

```bash
cd wrpper-app && VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

**Step 3: Manual E2E test**

1. Sign in at `localhost:5173`
2. Navigate to Settings
3. Confirm publishable key card appears below Organization card
4. Confirm key is masked (dots)
5. Click eye icon — key reveals as `sf_pub_NZ0L9a...`
6. Click copy — paste somewhere to verify full key
7. Click eye icon again — key re-masks

**Step 4: Test error state**

Temporarily stop the backend. Reload Settings page.
- The publishable key card should show "No publishable key found" or the page loads the other data with the key card gracefully empty (because of the independent `.catch`).

---

## Summary of Changes

| Repo | File | Change |
|------|------|--------|
| wrpper | `alembic/versions/api_key_encrypted_010.py` | New migration: adds `encrypted_key` column, backfills Wrpper key |
| wrpper | `app/middleware/auth.py` | Add `encrypted_key` field to `APIKey` model |
| wrpper | `app/api/admin.py` | Store `encrypted_key` on bootstrap |
| wrpper | `app/api/dashboard.py` | New `GET /v1/dashboard/publishable-key` endpoint |
| wrpper-app | `src/pages/Settings/SettingsPage.tsx` | Publishable key card with mask/reveal/copy |
