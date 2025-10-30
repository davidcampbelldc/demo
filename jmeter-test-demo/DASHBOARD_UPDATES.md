# Dashboard Test Button Updates

## Summary

Updated all dashboard test buttons and frontend functions to use the new 4-token validation system.

## Functions Updated

All frontend test functions now require and send all 4 tokens:
- `session_token`
- `session_id`
- `csrf_token`
- `correlation_id`
- `user_id`

### 1. Dashboard Test Functions (/dashboard)

#### ✅ testProfile()
- **Location**: Dashboard page
- **Updated**: Changed from GET with Authorization header to POST with all 4 tokens in body
- **Tests**: `/api/user/profile` endpoint

#### ✅ testViewCart()
- **Location**: Dashboard page
- **Updated**: Added `csrf_token` to request body
- **Tests**: `/api/cart/add` endpoint

#### ✅ testHttpTest()
- **Location**: Dashboard page
- **Updated**: Added `session_id` and `csrf_token` to request body
- **Tests**: `/api/http-test` endpoint (HTTP text response)

#### ✅ testHttpTestStep2()
- **Location**: Dashboard page
- **Updated**: Added `session_id` and `csrf_token` to request body
- **Tests**: `/api/http-test-step2` endpoint (multi-step correlation)

### 2. Login Page Function (/)

#### ✅ testAuthenticatedRequest()
- **Location**: Login page
- **Updated**: Added `session_id` and `csrf_token` to request body
- **Tests**: `/api/user/profile` endpoint from login page

### 3. Checkout Page Function (/checkout)

#### ✅ processCheckout()
- **Location**: Checkout page
- **Updated**: Added `session_id` and `csrf_token` to request body
- **Tests**: `/api/checkout/process` endpoint

### 4. Global Functions (All Pages)

#### ✅ window.addToCart() - 2 instances
- **Location**: Home page (/) and Products page
- **Updated**: Added `session_id` and `csrf_token` to request body
- **Tests**: `/api/cart/add` endpoint

## Common Pattern

All functions now follow this pattern:

```javascript
// Get all tokens from localStorage
const token = localStorage.getItem('session_token');
const sessionId = localStorage.getItem('session_id');
const csrfToken = localStorage.getItem('csrf_token');
const userId = localStorage.getItem('user_id');
const correlationId = localStorage.getItem('correlation_id');

// Validate all tokens are present
if (!token || !sessionId || !csrfToken || !userId || !correlationId) {
    showResult('error', 'Missing session data. Please login to get all required tokens.');
    return;
}

// Include all tokens in request body
const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        session_token: token,
        session_id: sessionId,
        csrf_token: csrfToken,
        correlation_id: correlationId,
        user_id: parseInt(userId),
        ... other data ...
    })
});
```

## Error Messages

All functions now display helpful error messages when tokens are missing:

```
Missing session data. Please login to get all required tokens
(session_token, session_id, csrf_token, correlation_id, user_id).
```

## Testing

1. **Login** at https://jmeter-test-demo.loadmagic.workers.dev
2. All 4 tokens will be stored in localStorage
3. Test any button on the dashboard - they will all work with 4-token validation
4. Try without logging in - you'll get clear error messages

## Files Modified

- `src/index.js` - Updated 7 frontend test functions

## Deployment

- ✅ Deployed to: https://jmeter-test-demo.loadmagic.workers.dev
- ✅ Version: 3c7a30dc-7ffb-43b1-8985-0d1995800afc
- ✅ All test buttons now work with 4-token validation
