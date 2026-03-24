## Goal

Create a demo flow where:

- early correlation failures are **silent**
- responses often still return **HTTP 200**
- the UI or payload looks **plausibly valid**
- state gets progressively corrupted
- the visible failure appears **later**
- the final symptom can be misleading, such as:
  - HTTP 500
  - empty data
  - wrong user context
  - checkout failure
  - intermittent pass/fail behaviour

This gives you an ideal proving ground for:

- root-cause tracing
- silent failure detection
- token lineage / dependency mapping
- confidence scoring
- self-healing logic
- “don’t just blame the last request” intelligence

------

# Proposed layered nasty flow

## Demo story: “Retail checkout with partial auth, token drift, degraded state, and late backend explosion”

A user:

1. visits home page
2. opens login page
3. logs in
4. browses product
5. adds item to basket
6. opens basket
7. starts checkout
8. selects delivery
9. loads payment page
10. confirms order

Under the hood, multiple dynamic values are introduced, and one or more can silently fail.

------

# Core dynamic values

I’d include these:

## Session/browser state

- `SESSIONID` cookie
- `visitorId`
- `deviceFingerprint`
- `journeyId`

## Login/auth state

- login page `csrfToken`
- login form `authFlowId`
- post-login `customerContextId`
- `authLevel`
- `idToken` or `accessToken`

## Commerce state

- `productViewToken`
- `basketId`
- `basketVersion`
- `checkoutFlowId`
- `deliveryQuoteToken`
- `paymentNonce`
- `pricingSignature`

## Optional extra evil

- hidden `pageInstanceId`
- rotating `requestVerificationToken`
- backend-generated `traceParent` / correlation identifier
- one token in HTML, one in JSON, one only in cookie/header

This is important because it forces your engine to handle:

- HTML extraction
- JSON extraction
- cookie/header continuity
- chained dependencies

------

# The layered failure design

We won’t have just one failure. We’ll have several opportunities for subtle corruption.

## Layer 1: Login “success” that is not fully successful

### Intended behaviour

User GETs `/login`, receives:

- `csrfToken`
- `authFlowId`
- initial cookie
- hidden `pageInstanceId`

Then POSTs `/login/submit`.

### Silent failure mode

If `authFlowId` or `csrfToken` is stale/wrong:

Server still returns:

- **HTTP 200**
- “Welcome back” page shell
- maybe navigation/header looks logged in
- maybe product browsing works

But backend does **not** properly establish all of:

- `customerContextId`
- authenticated basket ownership
- full checkout permissions

### Result

The script thinks login passed.
 But user is now in a **partial-auth ghost state**.

### Breadcrumbs

Include subtle signals like:

- `"authLevel":"guest-upgraded"`
- header says “My Account” but account API returns anonymous profile
- no `customerContextId` present in embedded JSON
- `Set-Cookie` missing expected auth cookie
- hidden warning flag like `"reauthRecommended":true`

This is gold because naive validation passes.

------

## Layer 2: Product/basket works anyway

### Intended behaviour

User views a product and adds it to basket.

Server returns:

- `productViewToken`
- `basketId`
- `basketVersion = 1`

### Silent failure mode

Even in partial-auth state, anonymous basket creation is allowed.

So:

- add to basket returns **HTTP 200**
- basket page loads
- item appears present

This makes earlier auth corruption harder to notice.

### Breadcrumbs

- basket ownership type = `"anonymous"`
- basket JSON includes `"mergePending":true`
- user name absent from basket summary
- account-linked offer not applied

Again, enough for a smart engine to notice, but easy for a script to miss.

------

## Layer 3: Basket version drift

### Intended behaviour

Every basket mutation increments `basketVersion`.

Example:

- add item → version 1
- promo calc → version 2
- delivery calc → version 3

### Silent failure mode

Script fails to capture latest `basketVersion`, keeps sending version 1.

Server behaviour:

- responds **HTTP 200**
- re-renders basket
- silently recalculates
- maybe issues a *new* version
- maybe drops one change without explicit error

### Result

Now state divergence starts:

- script thinks it is operating on current basket
- backend has moved on
- later checkout references mismatched basket state

### Breadcrumbs

- response contains `"versionConflictResolved":true`
- basket total unexpectedly changes
- promo disappears
- hidden field `basketVersion` differs from request

That’s lovely and rotten.

------

## Layer 4: Checkout flow token silently regenerated

### Intended behaviour

When user starts checkout, server returns:

- `checkoutFlowId`
- `deliveryAddressToken`
- `requestVerificationToken`

### Silent failure mode

If prior basket state is inconsistent, or login state was partial:

- checkout still loads with **HTTP 200**
- payment/delivery pages still render
- but server silently creates a **replacement checkoutFlowId**
- original downstream links are no longer valid

If script fails to capture the new `checkoutFlowId`, it continues using stale one.

### Result

This becomes the true time bomb.

### Breadcrumbs

- `"flowRecovered":true`
- `"recoveryMode":"state-rebuilt"`
- hidden field changed unexpectedly
- page contains a new `checkoutFlowId`
- address selection defaults/reset

This is ideal because the app looks like it recovered.

------

## Layer 5: Delivery quote token tied to new flow only

### Intended behaviour

Delivery options API returns:

- `deliveryQuoteToken`
- valid only for current `checkoutFlowId + basketVersion`

### Silent failure mode

Script sends stale flow ID but gets:

- **HTTP 200**
- list of delivery options
- maybe default option selected

However token is actually tied to the reissued flow, not the old one.

Or worse:

- UI page is HTML-generated from server fallback
- API token stored in embedded JS only
- script misses it

### Result

The state now *looks* complete but isn’t internally aligned.

### Breadcrumbs

- token source changes from HTML field to embedded JSON
- `"quoteStatus":"fallback"`
- delivery ETA generic instead of precise
- no premium options shown

------

## Layer 6: Payment page loads with generic fallback nonce

### Intended behaviour

Payment page gives:

- `paymentNonce`
- anti-forgery token
- pricing signature
- maybe third-party iframe session token

### Silent failure mode

Because checkout state is already degraded:

- payment page still loads with **HTTP 200**
- but `paymentNonce` is generic or invalid for final commit
- or nonce is tied to fallback anonymous flow
- or hidden field missing unless certain JS bootstrap data is captured

### Result

Everything still appears “fine enough” to a simple replay.

### Breadcrumbs

- generic `"riskMode":"review"`
- `"customerVerified":false`
- missing loyalty discount
- no saved address/payment methods
- hidden field count different from successful case

------

## Layer 7: Final confirm explodes

### Final request

```
POST /checkout/confirm
```

Backend tries to reconcile:

- session
- customerContextId
- basketId
- basketVersion
- checkoutFlowId
- deliveryQuoteToken
- paymentNonce
- pricingSignature

But because of the earlier silent corruption, they don’t line up.

### Result

Now return one of:

#### Option A: best for drama

- **HTTP 500 Internal Server Error**
- generic error page

#### Option B: also realistic

- **HTTP 200** with “Sorry, something went wrong”
- app-level failure in HTML/JSON

#### Option C: intermittent nightmare

- 500 only some of the time
- other times 409 / 422 / empty page / redirect to basket

That last one is especially evil because it mimics flaky environments.

------

# Recommended exact sequence

Here’s a clean layered version.

## Transaction 1 — Home

```
GET /
```

- returns `visitorId`, `journeyId`

## Transaction 2 — Login page

```
GET /login
```

- returns `csrfToken`, `authFlowId`, `pageInstanceId`

## Transaction 3 — Submit login

```
POST /login/submit
```

- stale `authFlowId` or `csrfToken`
- returns **HTTP 200**
- shell says “Welcome”
- but no proper `customerContextId`

## Transaction 4 — Account summary check

```
GET /api/account/summary
```

- returns **HTTP 200**
- JSON says `"authenticated": false` or `"authLevel":"partial"`
- optional: make this easy to miss

## Transaction 5 — Product page

```
GET /product/sku123
```

- returns `productViewToken`

## Transaction 6 — Add to basket

```
POST /api/basket/add
```

- returns `basketId`, `basketVersion=1`
- anonymous basket created successfully

## Transaction 7 — Basket page

```
GET /basket
```

- returns **HTTP 200**
- item visible
- subtle breadcrumb: `"ownership":"anonymous"`

## Transaction 8 — Start checkout

```
POST /checkout/start
```

- backend quietly rebuilds flow
- returns **HTTP 200**
- new `checkoutFlowId` generated
- script misses this and keeps old or null value

## Transaction 9 — Delivery options

```
POST /checkout/delivery/options
```

- returns delivery options with `deliveryQuoteToken`
- token tied to new flow, but script not aligned

## Transaction 10 — Payment page

```
GET /checkout/payment
```

- returns `paymentNonce` and `pricingSignature`
- fallback mode page still renders

## Transaction 11 — Confirm order

```
POST /checkout/confirm
```

- backend fails to match state
- returns **HTTP 500**

That’s your full murder mystery.

------

# Why this setup is especially useful for your platform

Because different agent capabilities can each prove their worth.

## Carrie / correlation detection

Can identify:

- token not extracted
- value changed but script reused stale value
- missing dependency link
- hidden state drift

## George / failure analysis

Can reason:

- 500 is not root cause
- likely earlier auth or flow-state corruption
- suspect missing `customerContextId` or stale `checkoutFlowId`

## Rupert / extraction specialist

Can detect:

- token moved from HTML to JSON
- hidden field shape changed
- need regex/JSONPath/header extraction

## Suzy / repair mode

Can:

- update extractor
- patch request dependencies
- add validation assertions
- regenerate transaction handling

This flow lets all of them earn their biscuits.

------

# Make it even nastier with optional twists

## Twist 1: mixed content types

Use:

- login token in HTML
- customer state in embedded script JSON
- basket version in JSON API
- auth continuity via cookie/header

So a single extraction strategy won’t solve everything.

------

## Twist 2: same HTTP code for pass and fail

For several steps, both success and degraded mode return **HTTP 200**.

Only content differs.

This is essential. It prevents lazy “status code validation”.

------

## Twist 3: plausible but wrong content

On degraded login:

- show account icon anyway
- show basket page anyway
- show delivery options anyway

So the script operator can’t spot it instantly by eye.

------

## Twist 4: server “self-healing” that makes things worse

When checkout starts, backend tries to repair broken state by issuing a new flow ID.

Great for demo because:

- app looks resilient
- script gets farther
- eventual failure becomes more misleading

------

## Twist 5: intermittent timing sensitivity

Add expiry on one token:

- valid for only 20–30 seconds
- under slower replay it expires
- sometimes passes, sometimes fails

That gives you realism, though I’d add this after the base flow works.

------

## Twist 6: business logic mismatch before technical explosion

Before final 500, let one page show:

- wrong basket total
- missing discount
- guest shipping instead of member shipping

So your agents can potentially catch business anomalies *before* technical failure.

That’s very sexy in a demo.

------

# Suggested response behaviours by step

Here’s a compact design matrix.

| Step             | Hidden problem             | HTTP status | Visible appearance   | Real issue                 |
| ---------------- | -------------------------- | ----------- | -------------------- | -------------------------- |
| Login submit     | stale csrf/authFlowId      | 200         | welcome shell        | partial auth only          |
| Account summary  | missing customer context   | 200         | lightweight JSON     | anonymous/partial state    |
| Add to basket    | allowed as guest           | 200         | basket works         | wrong ownership            |
| Start checkout   | flow rebuilt               | 200         | checkout loads       | new flow ID ignored        |
| Delivery options | token tied to rebuilt flow | 200         | options shown        | chain misaligned           |
| Payment page     | fallback nonce             | 200         | payment form visible | invalid finalisation token |
| Confirm order    | all state inconsistent     | 500         | generic error        | root cause earlier         |

------

# What to validate in the demo site

You want obvious and subtle observability.

## Obvious observability

- full request/response capture
- cookies
- hidden fields
- embedded JSON
- redirect history
- timing

## Subtle observability

Plant breadcrumbs such as:

- `authLevel`
- `ownershipType`
- `flowRecovered`
- `quoteMode`
- `riskMode`
- `recoveryReason`
- `versionConflictResolved`

These don’t need to be user-facing. They can sit in JSON or HTML comments or data attributes.

That gives your agents something meaningful to reason over.

------

# Best development phases

I’d build this in 3 phases.

## Phase 1 — deterministic basic corruption

Single silent fail:

- bad login token
- partial auth
- later 500

## Phase 2 — chained state drift

Add:

- basketVersion drift
- checkoutFlow regeneration
- delivery token mismatch

## Phase 3 — realism pack

Add:

- intermittent expiry
- mixed HTML/JSON extraction
- app-level 200 failures
- occasional alternate symptoms

This gives you progressive sophistication instead of jumping straight into the seventh circle of correlation hell.

------

# My favourite “full nasty” version

If I were designing the showcase demo, I’d use this exact storyline:

> Login silently degrades to partial auth because a stale authFlowId is submitted.
>  Basket creation still succeeds in anonymous mode, masking the problem.
>  Checkout silently rebuilds state and issues a new checkoutFlowId, but the script continues with the stale flow.
>  Delivery and payment pages still render with fallback tokens and HTTP 200 responses.
>  Final order confirmation throws HTTP 500 when basket, customer, checkout, and payment state can no longer be reconciled.

That is nasty, believable, layered, and brilliant for demonstrating intelligence.

------

# Recommendation

Build **one golden path** and **three failure injection switches**:

## Golden path

Everything correctly correlated, full successful order.

## Failure switch A

Break login `authFlowId` extraction.

## Failure switch B

Break `basketVersion` update after basket mutation.

## Failure switch C

Break `checkoutFlowId` extraction after flow regeneration.

That lets you test:

- one bad early token
- one mid-flow stale version
- one late hidden flow reset

You can run them independently or combine them for peak chaos.