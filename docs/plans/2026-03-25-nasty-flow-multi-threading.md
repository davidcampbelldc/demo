# Nasty Flow: Multi-Threading Correlation Traps

**Date:** 2026-03-25
**Status:** In Progress
**Repo:** demo (jmeter-test-demo)

## Goal

Make the Nasty Flow self-contained (no dependency on main login) and add realistic multi-threading correlation traps that exercise the full correlation workflow under concurrent load.

## Background

The existing Nasty Flow has 11 transactions (T1-T11) covering single-thread correlation edge cases: HTML entity encoding, decoy fields, CSRF expiry, silent auth degradation, large viewstate, SWEC counters, client-assembled values, header-only tokens, and cascading silent failures.

**What's missing:**
- No way to create multiple users/sessions for multi-threaded JMeter testing (only 2 hardcoded users)
- Session overwrite: second login for same user invalidates the first thread's session
- Password hash inconsistency between main login (`hash${pw}`) and nasty flow T3 (`hash_` + pw)
- No correlation traps that specifically target multi-threading issues

## Design Principles

1. **Realistic** — Every trap mirrors real enterprise app behaviour (ASP.NET, Siebel, Salesforce, Stripe)
2. **No silver platter** — Error messages are generic (502, 401, 200-with-wrong-data), not diagnostic
3. **Lean heavy** — Err towards the heavier end of likely complexity, but nothing artificial
4. **Self-contained** — Nasty flow works without the main demo login

## Changes

### 0. Fix password hash inconsistency

**Files:** `src/index.js` lines 240, 5220

The main login uses `hash${password}` (no underscore), the nasty T3 login-submit uses `hash_` + password. Align both to `hash_` + password (matches the seeded data format).

### 1. `/api/nasty/init` endpoint

**New route:** POST `/api/nasty/init`

Creates fresh users for nasty flow testing. Each call creates a user with:
- Auto-generated username: `nasty_<8char_random>`
- Password: `nasty_<8char_random>` (different from username)
- Stored with `hash_` + password in DB

**Request body:**
```json
{ "count": 1 }
```

**Response (count=1):**
```json
{
  "users": [
    {
      "user_id": 42,
      "username": "nasty_a1b2c3d4",
      "password": "nasty_x9y8z7w6",
      "session_token": "abc123...",
      "ready": true
    }
  ]
}
```

**Batch mode (count=N, max 50):** Returns N users. JMeter can call this once in setUp Thread Group and write results to CSV.

**Implementation:** INSERT into `users` table, generate session_token, UPDATE user row with token. Return credentials + token.

### 2. Sticky session cookie — ROUTEID (T1 enhancement)

**What changes:** `handleNastyHome` generates a `ROUTEID` cookie value derived from the nasty_session_id (`srv_` + first 8 chars of sha256). Sets it as a cookie on the T1 response.

**Validation:** All subsequent nasty endpoints (T2-T11) read the `ROUTEID` cookie and compare against the stored value. Mismatch returns **502 Bad Gateway** with a generic body:
```json
{ "error": "Bad Gateway", "status": 502 }
```
No mention of cookies, routing, or sessions. Just like a real load balancer error.

**DB change:** Add `route_id TEXT` column to `nasty_flow_sessions`.

**Correlation challenge:** JMeter's cookie manager must be per-thread. If two threads share a cookie jar, Thread B's ROUTEID overwrites Thread A's, causing 502s.

### 3. Dynamic form field names (T2/T3 enhancement)

**What changes in T2 (login page):**
- CSRF field: `<input name="csrf_token" ...>` becomes `<input name="csrf_<suffix>" ...>` where suffix = first 4 chars of sha256(nasty_session_id + 'field_salt')
- Auth flow ID field: `<input name="auth_flow_id" ...>` becomes `<input name="aflow_<suffix>" ...>` (same suffix)
- The `pageInstanceId` stays in the `<script>` block (unchanged)

**What changes in T3 (login submit):**
- Instead of reading `body.csrf_token`, reads `body['csrf_<suffix>']` by computing the expected field name from the session
- Same for auth_flow_id → `body['aflow_<suffix>']`

**DB change:** Add `field_name_suffix TEXT` column to `nasty_flow_sessions` (stored at T2 time).

**Correlation challenge:** The correlator can't use `name="csrf_token"` as a static regex. It must:
1. Extract the field name dynamically (regex like `name="(csrf_[a-z0-9]{4})"`)
2. Extract the value from that field
3. Send both the correct field name and value in T3

With multiple threads, each thread's form has a different field name suffix. Cross-thread extraction grabs the wrong field name.

### 4. Idempotency key on T6 (basket-add enhancement)

**What changes:**
- T6 expects an `Idempotency-Key` header (UUID format)
- Server stores `idempotency_key` + full response JSON in `nasty_flow_sessions`
- If a request arrives with an `Idempotency-Key` that matches ANY existing session's stored key, return that session's cached response (200, looks normal, but wrong basket_id for this thread)
- If no `Idempotency-Key` header is sent, return **400** with generic "Missing required header"

**DB change:** Add `idempotency_key TEXT` and `idempotency_response TEXT` columns to `nasty_flow_sessions`.

**Correlation challenge:** Each JMeter thread must generate a unique idempotency key per request (e.g., `${__UUID()}`). If threads share a variable or the key isn't regenerated per iteration, Thread B silently gets Thread A's cached basket response. The failure only manifests at T11 (basket_id mismatch), 5 transactions later.

### 5. Conditional response structure (T4/T9 enhancement)

**What changes in T4 (account summary):**
- If `auth_level=full`: response includes extra `loyalty` block:
  ```json
  "loyalty": {
    "tier": "gold",
    "rewardToken": "rwt_<token>",
    "pointsBalance": 2450
  }
  ```
- If `auth_level=guest-upgraded`: no `loyalty` block at all (key absent, not null)

**What changes in T9 (delivery options):**
- If not degraded: third delivery option `premium` added, and `X-Premium-Quote` response header set with a token
- If degraded: only 2 options (already the case), no `X-Premium-Quote` header

**What changes in T11 (confirm order):**
- New check: if `auth_level=full`, validates that `reward_token` matches stored value
- New check: if not degraded, validates `premium_quote_token` matches stored value
- Missing tokens when expected → FAIL (no explanation of why they should be present)

**DB change:** Add `reward_token TEXT` and `premium_quote_token TEXT` to `nasty_flow_sessions`.

**Correlation challenge:** The correlator must handle optional extraction. A regex for `rewardToken` must not error when the field is absent (guest-upgraded threads). With mixed auth levels across threads, a global "extract rewardToken from every T4 response" breaks for guest threads.

### 6. Request fingerprint header (T8 enhancement)

**What changes:**
- T8 expects `X-Request-Fingerprint` header = hex SHA-256 of `nasty_session_id|basket_id|basket_version|aura_context`
- Server computes expected fingerprint and compares
- Mismatch is treated as a state inconsistency → triggers silent flow rebuild (existing `flowRecovered` logic)
- The fingerprint value is NOT returned by any prior endpoint — the client must compute it from 4 previously-extracted values

**DB change:** None (uses existing `flow_recovered` flag).

**Correlation challenge:** The correlator must:
1. Extract 4 values from 4 different earlier responses (T1, T6, T7, T4)
2. Assemble them into a pipe-delimited string
3. Compute SHA-256
4. Send as a header

In multi-threaded execution, if any of the 4 values comes from the wrong thread, the fingerprint is wrong. The failure is silent (flow rebuild), surfacing only at T11.

**Note:** This requires client-side SHA-256 computation. JMeter can do this via `${__digest(SHA-256,...)}` function. For the browser demo page, use SubtleCrypto.

### 7. Client-side HTML updates

**getNastyFlowPage() changes:**
1. Remove "Login via the Login page first" message
2. Add "Initialize Session" button that calls `/api/nasty/init` (count=1)
3. Display returned credentials
4. Update `stepLoginPage()` to extract dynamic field names via regex `name="(csrf_[a-z0-9]{4})"\s+value="([^"]*)"`
5. Update `stepLoginSubmit()` to send extracted field names as keys
6. Update `stepBasketAdd()` to generate UUID and send `Idempotency-Key` header
7. Update `stepAccountSummary()` to capture `rewardToken` if present
8. Update `stepDeliveryOptions()` to capture `X-Premium-Quote` header if present
9. Update `stepCheckoutStart()` to compute SHA-256 fingerprint and send `X-Request-Fingerprint` header
10. Update `stepConfirmOrder()` to send `reward_token` and `premium_quote_token` if captured
11. Update step descriptions and edge-case tags

### 8. DB migration

New migration file: `migrations/add_nasty_threading.sql`

```sql
ALTER TABLE nasty_flow_sessions ADD COLUMN route_id TEXT;
ALTER TABLE nasty_flow_sessions ADD COLUMN field_name_suffix TEXT;
ALTER TABLE nasty_flow_sessions ADD COLUMN idempotency_key TEXT;
ALTER TABLE nasty_flow_sessions ADD COLUMN idempotency_response TEXT;
ALTER TABLE nasty_flow_sessions ADD COLUMN reward_token TEXT;
ALTER TABLE nasty_flow_sessions ADD COLUMN premium_quote_token TEXT;
```

Plus index on idempotency_key for the duplicate lookup:
```sql
CREATE INDEX IF NOT EXISTS idx_nasty_idempotency ON nasty_flow_sessions(idempotency_key);
```

## Implementation Order

1. Migration (task #9) — schema must exist first
2. Password hash fix (task #1) — foundation
3. Init endpoint (task #2) — unblocks testing
4. Sticky session / ROUTEID (task #3) — T1 change
5. Dynamic field names (task #4) — T2/T3 change
6. Idempotency key (task #5) — T6 change
7. Conditional responses (task #6) — T4/T9/T11 change
8. Request fingerprint (task #7) — T8 change
9. Client-side HTML (task #8) — all frontend changes

## Deployment

```bash
# Run migration
wrangler d1 execute jmeter-test-demo --remote --file=migrations/add_nasty_threading.sql

# Deploy worker
wrangler deploy --config jmeter-test-demo/wrangler.toml
```

## Rollback

All changes are additive (new columns, new endpoint, enhanced existing endpoints). No existing behaviour is removed. The password hash fix is the only breaking change — but the nasty T3 is currently broken anyway (mismatched hash format).
