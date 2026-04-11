-- Migration: add profile_uploads table for multipart/form-data upload demo flow
-- Layer 3 of peak3000#366 — CES design partner requirement
--
-- IMPORTANT: file contents are NOT persisted by the Worker. The upload handler
-- buffers the file in memory to validate size/content-type, computes a SHA-256
-- checksum, writes this metadata row, then discards the bytes. This is an
-- ephemeral-demo pattern, clearly flagged in the /profile page and the API
-- response so HAR capture / load-testing demos don't mislead viewers.

CREATE TABLE IF NOT EXISTS profile_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    upload_token TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'attachment',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    correlation_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_profile_uploads_user_id ON profile_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_uploads_upload_token ON profile_uploads(upload_token);
