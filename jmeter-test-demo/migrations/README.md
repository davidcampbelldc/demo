# Database Migrations

## Adding Session Columns Migration

This migration adds support for comprehensive session token validation including:
- `session_id`: Session identifier for tracking user sessions
- `csrf_token`: CSRF protection token
- `correlation_id`: Correlation identifier for request tracking

### How to Apply the Migration

If using Cloudflare D1, run:

```bash
# Navigate to the jmeter-test-demo directory
cd jmeter-test-demo

# Apply the migration to your D1 database
wrangler d1 execute jmeter-test-demo --file=migrations/add_session_columns.sql
```

### Verification

After applying the migration, you can verify the columns were added:

```bash
wrangler d1 execute jmeter-test-demo --command="PRAGMA table_info(users);"
```

You should see `session_id`, `csrf_token`, and `correlation_id` columns in the output.

### What This Changes

After applying this migration, all API endpoints will now require **4 tokens** for authentication:

1. **session_token** - Primary session authentication token
2. **session_id** - Session identifier (format: `sess_<user_id>_<timestamp>`)
3. **csrf_token** - CSRF protection token
4. **correlation_id** - Request correlation identifier

These tokens are all returned by the `/api/login` endpoint and must be included in subsequent requests.

### Example JMeter Correlation

When testing with JMeter, you'll need to extract all 4 tokens from the login response:

```json
{
  "session_token": "tok_abc123...",
  "session_id": "sess_1_1234567890",
  "csrf_token": "tok_xyz789...",
  "correlation_id": "tok_def456...",
  "user_id": 1
}
```

Then include all of them in subsequent API calls:

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
