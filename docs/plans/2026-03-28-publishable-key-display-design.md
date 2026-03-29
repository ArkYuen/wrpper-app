# Publishable Key Display — Design Doc

**Date:** 2026-03-28
**Status:** Approved

## Goal

Display the org's publishable API key on the Settings page with mask/reveal toggle and copy-to-clipboard, so users can retrieve their key without needing the original bootstrap output.

## Approach: Encrypted Storage (Option A)

Store the raw publishable key encrypted (Fernet) in the `api_keys` table. Existing Fernet infrastructure in `app/core/encryption.py` is reused. This is the same security model used for OAuth tokens in `platform_connections`.

## Backend

### Migration
- Add nullable `encrypted_key TEXT` column to `api_keys` table
- Backfill Wrpper org's known publishable key (`sf_pub_NZ0L9aZRTwGQjRlqeBJcG1Ku6hNNYTxqEFzPZUzQj70`) by encrypting with Fernet
- Must be idempotent (use `sqlalchemy.inspect()` column check)

### Endpoint: `GET /v1/dashboard/publishable-key`
- Auth: `require_supabase_auth`
- Query: `api_keys` where `organization_id = auth.org_id`, `key_type = "publishable"`, `is_active = True`
- Response: `{ "key": "sf_pub_..." | null, "prefix": "sf_pub_NZ0L9a", "created_at": "..." }`
- Decrypts `encrypted_key` via `decrypt_token()` if populated; returns `key: null` if column is empty

### Bootstrap update
- Modify `admin.py` bootstrap to store `encrypted_key = encrypt_token(raw_pub)` when generating new keys

## Frontend

### File: `src/pages/Settings/SettingsPage.tsx`

New card section below existing "Organization" card:
- `.card` wrapper consistent with page layout
- Read-only `.input` field, masked by default (`••••••••••`)
- Eye icon button toggles reveal/hide
- Copy button with "Copied!" feedback (reuses existing pattern from pixel snippet copy)
- Fetch via `apiFetch("/v1/dashboard/publishable-key")` on mount

### Error handling
- Fetch failure: red banner above card
- `key: null`: show prefix with "Full key unavailable" note
- No key row: "No publishable key found" muted text

## Security
- Encrypted at rest with Fernet (same as OAuth tokens)
- Only accessible via authenticated dashboard endpoint (Supabase JWT)
- Secret keys are NOT exposed — only publishable keys

## Testing
- Backend: endpoint returns decrypted key for authed user, rejects unauthed
- Frontend: manual verification of mask/reveal, copy, loading/error states
