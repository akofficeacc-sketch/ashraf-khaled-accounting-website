CREATE TABLE IF NOT EXISTS contact_messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email      TEXT,
  service    TEXT,
  message    TEXT NOT NULL,
  lang       TEXT NOT NULL DEFAULT 'ar' CHECK (lang IN ('ar','en')),
  handled    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at DESC);
