# JMeter Correlation Update Summary

## Overview
Updated the JMeter test demo API to require **4 tokens** for comprehensive correlation testing instead of just the session token.

## Tokens Required

All request-body authenticated endpoints now require these 4 tokens:

1. **session_token** - Primary session authentication token (format: `tok_...`)
2. **session_id** - Session identifier (format: `sess_<user_id>_<timestamp>`)
3. **csrf_token** - CSRF protection token (format: `tok_...`)
4. **correlation_id** - Request correlation identifier (format: `tok_...`)

## Updated Endpoints

The following endpoints now require and validate all 4 tokens:

### ✅ Updated (Request Body Authentication)

1. **POST /api/login** - Now stores all 4 tokens in database
2. **POST /api/user/profile** - Validates all 4 tokens
3. **POST /api/cart/add** - Validates all 4 tokens
4. **POST /api/checkout/process** - Validates all 4 tokens (+ checkout_token)
5. **POST /api/http-test** - Validates all 4 tokens
6. **POST /api/http-test-step2** - Validates all 4 tokens (+ step2_token)

### ℹ️ Not Updated (Bearer Token Authentication)

These endpoints use Bearer token header authentication and were not modified:

- **GET /api/cart** - Uses `Authorization: Bearer {token}` header
- **POST /api/orders** - Uses `Authorization: Bearer {token}` header
- **GET /api/orders/:token** - Public endpoint

## Database Changes Required

### Migration File
Created: `migrations/add_session_columns.sql`

This migration adds three new columns to the `users` table:
- `session_id TEXT`
- `csrf_token TEXT`
- `correlation_id TEXT`

### Apply Migration

```bash
cd jmeter-test-demo
wrangler d1 execute jmeter-test-demo --file=migrations/add_session_columns.sql
```

## API Changes

### Login Response (Before)
```json
{
  "success": true,
  "user_id": 1,
  "session_token": "tok_abc123...",
  "session_id": "sess_1_1234567890",     // Generated but not stored
  "csrf_token": "tok_xyz789...",          // Generated but not stored
  "correlation_id": "tok_def456..."       // Generated but not stored
}
```

### Login Response (After)
```json
{
  "success": true,
  "user_id": 1,
  "session_token": "tok_abc123...",       // Stored & validated
  "session_id": "sess_1_1234567890",      // Stored & validated ✨
  "csrf_token": "tok_xyz789...",          // Stored & validated ✨
  "correlation_id": "tok_def456..."       // Stored & validated ✨
}
```

### Subsequent Request Example
```json
{
  "session_token": "tok_abc123...",
  "session_id": "sess_1_1234567890",
  "csrf_token": "tok_xyz789...",
  "correlation_id": "tok_def456...",
  "user_id": 1,
  ... other request data ...
}
```

## JMeter Correlation Setup

### Extractors Needed

After the login request, you'll need to extract all 4 tokens:

#### JSON Extractor 1: Session Token
- Variable: `session_token`
- JSON Path: `$.session_token`

#### JSON Extractor 2: Session ID
- Variable: `session_id`
- JSON Path: `$.session_id`

#### JSON Extractor 3: CSRF Token
- Variable: `csrf_token`
- JSON Path: `$.csrf_token`

#### JSON Extractor 4: Correlation ID
- Variable: `correlation_id`
- JSON Path: `$.correlation_id`

#### JSON Extractor 5: User ID
- Variable: `user_id`
- JSON Path: `$.user_id`

### Using Variables in Subsequent Requests

In your JMeter HTTP Request body:

```json
{
  "session_token": "${session_token}",
  "session_id": "${session_id}",
  "csrf_token": "${csrf_token}",
  "correlation_id": "${correlation_id}",
  "user_id": ${user_id},
  ... other parameters ...
}
```

## Error Handling

### Missing Tokens Error (400)
```json
{
  "error": "Missing required fields",
  "required": [
    "session_token",
    "user_id",
    "correlation_id",
    "session_id",
    "csrf_token"
  ],
  "message": "All session data must be provided in request body for correlation testing"
}
```

### Invalid Tokens Error (401)
```json
{
  "error": "Invalid session data",
  "message": "One or more session tokens are invalid or mismatched (session_token, user_id, session_id, csrf_token, or correlation_id)"
}
```

## Testing the Changes

### 1. Apply the Database Migration
```bash
wrangler d1 execute jmeter-test-demo --file=migrations/add_session_columns.sql
```

### 2. Test Login
```bash
curl -X POST https://your-worker.workers.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser1", "password": "123"}'
```

Expected: All 4 tokens in response

### 3. Test Profile Endpoint
```bash
curl -X POST https://your-worker.workers.dev/api/user/profile \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "tok_...",
    "session_id": "sess_...",
    "csrf_token": "tok_...",
    "correlation_id": "tok_...",
    "user_id": 1
  }'
```

Expected: 200 OK with profile data

### 4. Test with Missing Token
```bash
curl -X POST https://your-worker.workers.dev/api/user/profile \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "tok_...",
    "user_id": 1
  }'
```

Expected: 400 Bad Request with missing fields error

## Files Modified

- `src/index.js` - Updated 7 API handlers with 4-token validation

## Files Created

- `migrations/add_session_columns.sql` - Database migration script
- `migrations/README.md` - Migration instructions
- `CORRELATION_UPDATE_SUMMARY.md` - This summary document

## Next Steps

1. **Apply the database migration** (required for the code to work)
2. **Deploy the updated worker** with `wrangler deploy`
3. **Update your JMeter test script** to extract and use all 4 tokens
4. **Test the flow** to ensure proper correlation

## Notes

- The Bearer token endpoints (`/api/cart` GET and `/api/orders` POST) were intentionally left unchanged as they test a different authentication pattern
- All request-body authenticated endpoints now require strict 4-token validation
- Tokens are validated against the database on every request
- This provides a comprehensive JMeter correlation testing scenario
