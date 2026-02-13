-- Migration: Add Facebook Group Source Tracking
-- Purpose: Track users who came from or know about the Facebook group "Preciso de um Advogado"

ALTER TABLE users ADD COLUMN IF NOT EXISTS from_facebook_group BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS users_facebook_group_idx ON users(from_facebook_group);

-- Optional: Create a view to see Facebook group members
CREATE OR REPLACE VIEW facebook_group_members AS
SELECT id, email, name, role, from_facebook_group, created_at
FROM users
WHERE from_facebook_group = TRUE
ORDER BY created_at DESC;
