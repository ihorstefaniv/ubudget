-- UBudget Internal Task Manager
CREATE TABLE IF NOT EXISTS tasks (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text        NOT NULL,
  description   text,
  type          text        DEFAULT 'task'    CHECK (type    IN ('bug','feature','task','chore','idea')),
  status        text        DEFAULT 'backlog' CHECK (status  IN ('backlog','todo','in_progress','review','done')),
  priority      text        DEFAULT 'medium'  CHECK (priority IN ('low','medium','high','critical')),
  assignee      text,
  due_date      date,
  estimated_hrs numeric,
  logged_hrs    numeric     DEFAULT 0,
  created_by    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Автооновлення updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: тільки адміни
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all" ON tasks
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin','superadmin')
    )
  );
