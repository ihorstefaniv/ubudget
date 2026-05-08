CREATE TABLE IF NOT EXISTS api_keys (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  key           text        NOT NULL UNIQUE,
  name          text        NOT NULL,
  plan          text        DEFAULT 'free' CHECK (plan IN ('free','pro','business')),
  is_active     boolean     DEFAULT true,
  requests_total bigint     DEFAULT 0,
  created_by    uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  last_used_at  timestamptz
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all" ON api_keys
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin','superadmin')
    )
  );
