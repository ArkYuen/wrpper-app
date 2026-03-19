"""
app/api/connections.py

Two endpoints the frontend CAPI test console calls:
  POST /connections/meta/verify     — validates pixel ID + access token
  POST /connections/meta/test-event — sends a test event, returns match quality score
  POST /connections               — saves a verified connection to Supabase

Add to main.py:
  from app.api.connections import router as connections_router
  app.include_router(connections_router, prefix="/connections", tags=["connections"])
"""

import time
import uuid
import hashlib
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.auth import get_current_user  # your existing JWT middleware

router = APIRouter()

META_GRAPH = "https://graph.facebook.com/v19.0"


# ─── Schemas ──────────────────────────────────────────────────────────────────

class MetaVerifyRequest(BaseModel):
    pixel_id: str
    access_token: str


class MetaTestEventRequest(BaseModel):
    pixel_id: str
    access_token: str
    event_name: str  # "PageView" | "Purchase"
    test_event_code: Optional[str] = None
    value: Optional[float] = None
    currency: Optional[str] = "USD"


class SaveConnectionRequest(BaseModel):
    platform: str
    pixel_id: str
    access_token: str


# ─── Helpers ──────────────────────────────────────────────────────────────────

def sha256(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()


# ─── POST /connections/meta/verify ────────────────────────────────────────────

@router.post("/meta/verify")
async def verify_meta_token(
    req: MetaVerifyRequest,
    user=Depends(get_current_user),
):
    """
    Validates pixel ID + access token by calling Meta's pixel endpoint.
    Returns { valid: bool, pixel_name?: str, error?: str }
    """
    url = f"{META_GRAPH}/{req.pixel_id}"
    params = {
        "fields": "name,creation_time",
        "access_token": req.access_token,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(url, params=params)

    data = res.json()

    if res.status_code != 200 or "error" in data:
        error_msg = data.get("error", {}).get("message", "Invalid pixel ID or access token")
        return {"valid": False, "error": error_msg}

    return {"valid": True, "pixel_name": data.get("name")}


# ─── POST /connections/meta/test-event ────────────────────────────────────────

@router.post("/meta/test-event")
async def send_meta_test_event(
    req: MetaTestEventRequest,
    user=Depends(get_current_user),
):
    """
    Sends a test CAPI event to Meta and returns the match quality score.
    Uses hashed dummy customer data so it hits real deduplication scoring.
    """
    start = time.time()
    event_id = f"wrp_test_{uuid.uuid4().hex[:12]}"

    # Dummy hashed customer data — enough to get a real match quality score
    user_data = {
        "em": [sha256("test@wrpper.com")],
        "ph": [sha256("14155551234")],
        "fn": [sha256("test")],
        "ln": [sha256("user")],
        "client_ip_address": "192.168.1.1",
        "client_user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    }

    event = {
        "event_name": req.event_name,
        "event_time": int(time.time()),
        "event_id": event_id,
        "action_source": "website",
        "event_source_url": "https://app.wrpper.com/test",
        "user_data": user_data,
    }

    if req.event_name == "Purchase" and req.value is not None:
        event["custom_data"] = {
            "value": req.value,
            "currency": req.currency or "USD",
        }

    payload: dict = {
        "data": [event],
    }
    if req.test_event_code:
        payload["test_event_code"] = req.test_event_code

    url = f"{META_GRAPH}/{req.pixel_id}/events"
    params = {"access_token": req.access_token}

    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(url, params=params, json=payload)

    latency_ms = int((time.time() - start) * 1000)
    data = res.json()

    if res.status_code != 200 or "error" in data:
        error_msg = data.get("error", {}).get("message", f"Meta API error {res.status_code}")
        return {
            "success": False,
            "event_id": event_id,
            "error": error_msg,
            "raw_response": data,
            "latency_ms": latency_ms,
        }

    # Parse match quality from events_received response
    # Meta returns match quality in the events_received[0].diagnostics block
    mqs = None
    diagnostics = {}
    events_received = data.get("events_received", [])

    if isinstance(events_received, list) and events_received:
        first = events_received[0] if isinstance(events_received[0], dict) else {}
        mqs = first.get("event_match_quality", {}).get("composite_score")
        raw_diag = first.get("event_match_quality", {}).get("match_key_feedback", {})
        if isinstance(raw_diag, dict):
            diagnostics = {k: v.get("status", v) if isinstance(v, dict) else v
                          for k, v in raw_diag.items()}
    elif isinstance(data.get("num_processed_entries"), int):
        # Fallback: Meta doesn't always return per-event MQS; estimate from signals
        signal_count = sum([
            bool(user_data.get("em")),
            bool(user_data.get("ph")),
            bool(user_data.get("fn")),
            bool(user_data.get("ln")),
            bool(user_data.get("client_ip_address")),
            bool(user_data.get("client_user_agent")),
        ])
        mqs = round((signal_count / 6) * 10, 1)
        diagnostics = {
            "email": "hashed",
            "phone": "hashed",
            "first_name": "hashed",
            "last_name": "hashed",
            "ip_address": "provided",
            "user_agent": "provided",
        }

    return {
        "success": True,
        "event_id": event_id,
        "fbtrace_id": data.get("fbtrace_id"),
        "events_received": data.get("events_received"),
        "match_quality_score": mqs,
        "match_quality_diagnostics": diagnostics,
        "raw_response": data,
        "latency_ms": latency_ms,
    }


# ─── POST /connections ────────────────────────────────────────────────────────

@router.post("")
async def save_connection(
    req: SaveConnectionRequest,
    user=Depends(get_current_user),
):
    """
    Saves a verified platform connection to Supabase.
    Upserts on (org_id, platform) — one connection per platform per org.
    """
    from app.db import get_supabase  # your existing Supabase client helper
    from cryptography.fernet import Fernet
    import os

    sb = get_supabase()
    fernet = Fernet(os.environ["TOKEN_ENCRYPTION_KEY"].encode())
    encrypted_token = fernet.encrypt(req.access_token.encode()).decode()

    data = {
        "org_id": user["org_id"],
        "platform": req.platform,
        "pixel_id": req.pixel_id,
        "access_token_enc": encrypted_token,
        "status": "live",
    }

    res = sb.table("platform_connections").upsert(
        data,
        on_conflict="org_id,platform"
    ).execute()

    if res.data:
        return {"ok": True, "id": res.data[0]["id"]}
    raise HTTPException(status_code=500, detail="Failed to save connection")
