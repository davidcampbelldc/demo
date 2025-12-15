# LoadMagic.ai – AI Correlation Edge‑Case Checklist

This document defines a **standardised set of edge cases** for validating AI‑driven correlation across JMeter, Locust, and future performance‑testing tools.

It is intended for:
- Demo / showcase environments
- Regression testing
- Internal QA
- Future tool compatibility validation

---

## 0. Prioritisation (Cost/Benefit)

Legend:
- **Priority:** P0 (Must-have), P1 (Should-have), P2 (Nice-to-have), P3 (Future)
- **Effort:** S (~0.5–2h), M (~0.5–2d), L (multi-day / plumbing)
- **Benefit:** How much this reduces real-world correlation failures and/or improves demo credibility

| Area | Case | Priority | Effort | Benefit | Status | Notes |
|---|---|---:|---:|---:|---:|---|
| Basic | Simple JSON token | P0 | S | High | ✅ Done | Baseline regression guardrail |
| Basic | HTTP regex in HTML | P0 | S | High | ✅ Done | Very common in legacy/SSR apps |
| Basic | Short/small dynamic value | P1 | S | Med | ✅ Done | Helps avoid missing subtle dynamics |
| Size | Large dynamic value (e.g. ViewState ~400KB) | P0 | S–M | High | ✅ Done | Chunking/limits/timeouts |
| Size | Large request + response | P1 | M | Med–High | ✅ Done | End-to-end payload handling |
| Volume | High token density (50–200) | P1 | M | High | ✅ Done | Dashboard1 Flow A2 Step 9 (200 decoys; only 1–2 reused) |
| Ambiguity | Multiple similar tokens | P0 | S | High | ✅ Done | Dashboard1 Flow A2 Step 9 (real token is `meta.csrf`) |
| Ambiguity | Same token name, different scope | P1 | S | Med–High | ✅ Done | Dashboard1 Flow A2 Step 9→10 (`sessionId` vs `admin.sessionId`) |
| Ambiguity | Decoy tokens / traps | P1 | S | High | ✅ Done | Dashboard1 Flow A1 Step 7 (body decoy) + Flow A2 Step 9 (200 decoys) |
| Headers | Header-only tokens (cookies/headers) | P0 | S | High | ✅ Done | Dashboard1 Flow A1 Step 7 (`X-CSRF-TOKEN` response header) |
| Cookies | Multi cookies + attribute reorder | P1 | S | Med | ✅ Done | Dashboard1 Flow A1 Step 7 (multiple Set-Cookie headers + attribute reorder) |
| Mutation | Token changes mid-journey | P1 | M | High | ⏳ To do | Split into a dedicated pair/flow to keep other tests independent |
| Encoding | Line feeds in regex | P0 | S | High | ✅ Done | Quick win; breaks naive regex |
| Encoding | HTML-encoded vs raw | P1 | S | Med–High | ✅ Done | Dashboard1 Flow B Step 11→12 (HTML entity decoding required) |
| Noise | High-entropy but static | P0 | S | High | ✅ Done | Dashboard1 Flow B Step 11 (static high-entropy fields, never reused) |
| Noise | Uncorrelatable random data | P1 | S | Med | ✅ Done | Dashboard1 Flow B Step 11 (per-request UUID noise, never reused) |
| Multipart | multipart/form-data | P2 | M | Med | ⏳ Later | Useful, but more effort |
| Composite | Split/concatenated token | P2 | M | Med | ⏳ Later | Needs clearer expected behaviour |
| Binary | Base64 tokens / wrapped base64 | P2 | M | Med | ⏳ Later | Useful if you expect uploads/blobs |
| Transport | gzip/brotli, chunked transfer | P2 | M | Low–Med | ⏳ Later | Often handled by libs |
| Future | WebSocket/SSE token handover | P3 | L | High | 🧠 Future | Great differentiator; plan later |

**Recommendation:** Build all **P0** first (demo-ready fast), then the **P1** set for hardening. Keep **WebSocket/SSE** as a **future milestone**.

---

## 1. Basic & Structural Cases

### 1.1 Simple JSON Token
- Single dynamic value
- Clear key/value
- Used once in a subsequent request

**Purpose:** Baseline sanity check

---

### 1.2 HTTP Regex (HTML Response)
- Token embedded in HTML
- Extracted via regex

**Purpose:** Validate non‑JSON parsing

---

### 1.3 Short / Small Dynamic Value
- Length < 5 characters
- Alphanumeric

**Purpose:** Detect low‑entropy dynamic values

---

## 2. Size & Volume Stress Cases

### 2.1 Large Dynamic Value (e.g. ViewState ~400KB)
- Single token
- Embedded in response body

**Purpose:** Test memory, regex limits, AI chunking

---

### 2.2 Large Request + Large Response
- Request body ~400KB
- Response body ~400KB

**Purpose:** End‑to‑end handling under heavy payloads

---

### 2.3 High Token Density Response
- 50–200 dynamic‑looking values
- Only 1–2 actually reused later

**Purpose:** Ranking & false‑positive resistance

---

## 3. Ambiguity & Disambiguation

### 3.1 Multiple Similar Tokens
```json
{
  "csrf": "AAA111",
  "previous_csrf": "BBB222",
  "meta": { "csrf": "CCC333" }
}
```

**Purpose:** Correct match selection

---

### 3.2 Same Token Name, Different Context
```json
{
  "sessionId": "user-123",
  "admin": { "sessionId": "admin-999" }
}
```

**Purpose:** Context awareness

---

### 3.3 Misleading / Decoy Tokens
- Fake token early in response
- Real token later

**Purpose:** Avoid incorrect extraction

---

## 4. Transport & Protocol Variants

### 4.1 Header‑Only Tokens
- `Set-Cookie`
- `Authorization`
- Custom headers (`X-CSRF-TOKEN`)

**Purpose:** Non‑body extraction

---

### 4.2 Multiple Cookies & Attribute Reordering
- Several cookies set
- Attributes in varying order

**Purpose:** Cookie parsing robustness

---

### 4.3 Multipart / Mixed Content
- `multipart/form-data`
- JSON + binary payload

**Purpose:** Boundary & parser handling

---

## 5. Token Construction & Mutation

### 5.1 Split / Concatenated Tokens
```html
<script>
  var a = "ABC";
  var b = "123";
  window.token = a + b;
</script>
```

**Purpose:** Composite value detection

---

### 5.2 Token Changes Mid‑Journey
- First response returns Token A
- Next response returns Token B
- Token invalidated after use

**Purpose:** Stateful correlation

---

## 6. Encoding & Unicode

### 6.1 Line Feeds in Regex Matches
- `\n`, `\r\n`

**Purpose:** Multiline handling

---

### 6.2 Emojis & Extended Unicode
- Emoji characters
- Non‑ASCII text

**Purpose:** UTF‑8 safety

---

### 6.3 Unicode Normalisation
- Visually identical but byte‑different characters

**Purpose:** Encoding correctness

---

### 6.4 HTML‑Encoded vs JSON‑Encoded Values
```json
"&lt;script&gt;"
"<script>"
```

**Purpose:** Decoding logic

---

## 7. Binary & Encoded Payloads

### 7.1 Base64 Tokens
- Embedded in JSON
- Embedded in multipart payloads

**Purpose:** Binary‑safe extraction

---

### 7.2 Base64 with Line Breaks
- Wrapped base64 strings

**Purpose:** Regex resilience

---

## 8. Noise & False‑Positive Control

### 8.1 High‑Entropy but Static Values
- Random‑looking values
- Never reused

**Purpose:** Prevent over‑correlation

---

### 8.2 Uncorrelatable Random Data
- UUIDs generated per request
- Never referenced again

**Purpose:** Confidence scoring accuracy

---

## 9. Compression & Transfer (Optional Advanced)

### 9.1 GZIP / Brotli Responses

**Purpose:** Decompression safety

---

### 9.2 Chunked Transfer Encoding

**Purpose:** Streaming compatibility

---

## 10. Forward‑Looking / Future Tooling

### 10.1 WebSocket / SSE Token Handover
- Token negotiated via HTTP
- Used over WebSocket

**Purpose:** Cross‑protocol correlation

---

## 11. Recommended Endpoint Naming

```
/case/simple-json
/case/header-only-token
/case/ambiguous-json
/case/false-positive-trap
/case/split-token
/case/high-density
```

**Purpose:** Predictable automation & demos

---

## 12. Implementation Plan (Efficient “Birds With One Stone”)

Goal: implement the backlog with the **fewest endpoints** while maximising coverage.

### 12.1 Design principle
Build **composable flows** where each flow introduces 2–4 edge characteristics at once:
- *Where the token lives* (body vs headers vs cookies)
- *How many candidates exist* (single vs ambiguous vs decoy)
- *How it evolves* (static vs changes mid-journey)
- *How hard it is to parse* (encoded/multipart/binary)

Keep endpoints **predictable** so you can auto-generate HARs and regression tests.

---

### 12.2 Public vs Protected classification

**Decision:** The current demo site is now treated as **Protected / Internal IP**.  
A **separate, simpler Public Demo site** will be created with a reduced, safe subset of cases.

This avoids accidental IP leakage and keeps marketing demos clean and predictable.

Legend:
- **Protected (Primary)**: Full internal demo, training, regression, agent tuning
- **Public (Secondary)**: Marketing demos, videos, shareable HARs

| Area | Case | Priority | Deployment | Rationale |
|---|---|---:|---:|---|
| Basic | Simple JSON token | P0 | Public + Protected | Table-stakes; expected by all users |
| Basic | HTTP regex in HTML | P0 | Public + Protected | Common legacy pattern; good demo value |
| Basic | Short/small dynamic value | P1 | Public (simple) + Protected (subtle) | Public version kept obvious; protected version more ambiguous |
| Size | Large dynamic value (ViewState ~400KB) | P0 | **Protected only** | Reveals chunking, limits, performance strategies |
| Size | Large request + response | P1 | **Protected only** | Shows end-to-end payload handling depth |
| Volume | High token density (50–200) | P1 | **Protected only** | Core AI ranking & confidence IP |
| Ambiguity | Multiple similar tokens | P0 | **Protected only** | Disambiguation logic is differentiating |
| Ambiguity | Same token name, different scope | P1 | **Protected only** | Context-aware reasoning |
| Ambiguity | Decoy tokens / traps | P1 | **Protected only** | Explicit false-positive resistance |
| Headers | Header-only tokens (cookies/headers) | P0 | **Protected only** | Still breaks many tools; valuable IP |
| Cookies | Multi cookies + attribute reorder | P1 | **Protected only** | Parser robustness differentiator |
| Mutation | Token changes mid-journey | P1 | **Protected only** | Stateful correlation logic |
| Encoding | Line feeds in regex | P0 | Public + Protected | Common regex pitfall; safe to expose |
| Encoding | HTML-encoded vs raw | P1 | Public + Protected | Common encoding mismatch |
| Noise | High-entropy but static | P0 | **Protected only** | Preventing over-correlation is key IP |
| Noise | Uncorrelatable random data | P1 | **Protected only** | Confidence calibration logic |
| Multipart | multipart/form-data | P2 | **Protected only** | Higher effort + deeper parsing logic |
| Composite | Split/concatenated token | P2 | **Protected only** | Advanced extraction reasoning |
| Binary | Base64 tokens / wrapped base64 | P2 | **Protected only** | Binary-safe extraction IP |
| Transport | gzip/brotli, chunked | P2 | **Protected only** | Internal hardening |
| Future | WebSocket/SSE token handover | P3 | **Protected only** | Long-term strategic differentiator |

**Rule of thumb:**
- Public = *"works on what users expect"*
- Protected = *"reveals how we win"*

---

### 12.3 Minimal endpoint set (recommended)

#### Flow A1 — “Headers + Cookies” (covers multiple P0/P1)
**Purpose:** validate header-only token extraction + cookie persistence without blocking other cases.

Endpoints (implemented on **Dashboard1** as Steps 7–8):
1. `POST /api/dashboard1/step7` (Flow A1 start)
   - Returns **Set-Cookie**: `flowa_session=<id>` (+ extra cookies with attribute reordering)
   - Returns header **X-CSRF-TOKEN: <tokenA>**
   - Response body contains a **decoy** `csrf` value as well
2. `POST /api/dashboard1/step8` (Flow A1 confirm)
   - Requires **cookie flowa_session** + **header X-CSRF-TOKEN=<tokenA>**
   - Requires body: `{ "csrf": "<tokenA>" }` (**header → body**)

---

#### Flow A2 — “Ambiguity + Decoys + Scope” (covers multiple P0/P1)
**Purpose:** high token density + ambiguity + scope, independent from header-only extraction.

Endpoints (implemented on **Dashboard1** as Steps 9–10):
1. `POST /api/dashboard1/step9` (Flow A2 start)
   - Returns **Set-Cookie**: `flowa2_session=<id>`
   - Returns JSON with:
     - multiple similar candidates: `csrf`, `previous_csrf`, `meta.csrf` (**real token is `meta.csrf`**)
     - scope confusion: `sessionId` vs `admin.sessionId`
     - high token density: `decoys` (50–200, default 200)
2. `POST /api/dashboard1/step10` (Flow A2 confirm)
   - Requires **cookie flowa2_session**
   - Requires header **X-FlowA-CSRF=<meta.csrf>** (**body → header**)
   - Requires body **csrf=<meta.csrf>** (**body → body**)
   - Requires header **X-Admin-SessionId=<admin.sessionId>** (**body → header, scope test**)

---

#### Flow B — “Encoding + Noise” (covers multiple P0/P1)
**Purpose:** validate HTML decoding needs and “do nothing” false-positive control.

Endpoints (implemented on **Dashboard1** as Steps 11–12):
1. `POST /api/dashboard1/step11` (Flow B start)
   - Returns **Set-Cookie**: `flowb_session=<id>`
   - Returns **HTML** (text/html) containing:
     - real token: hidden input `csrf_html="<HTML-encoded token>"`
     - decoy token: hidden input `csrf_decoy="<HTML-encoded token>"`
     - static high-entropy noise fields (`static_noise_###`) (never reused)
     - per-request UUID noise fields (`uuid_noise_###`) (never reused)
2. `POST /api/dashboard1/step12` (Flow B confirm)
   - Requires **cookie flowb_session**
   - Requires header **X-HTML-CSRF=<decoded token>** (**body → header**)
   - Requires body **csrf=<decoded token>** (**body → body**)
   - Rejects the HTML-encoded form (e.g. values containing `&amp;`)

---

## 13. Success Criteria (Per Case) (Per Case)

Each case should validate:
- Correct value identified
- Correct scope applied
- Correct reuse location
- No false positives
- Clear confidence/rationale (AI explainability)

---

**Document Version:** 1.1  
**Owner:** LoadMagic.ai  
**Intended Audience:** Dev, QA, AI Agent Authors
