-- Supabase Schema for CJA VERIXA - Revised RBAC Rules

-- 1. Create custom users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Rule: Only these two specific emails can be owners
    CONSTRAINT owner_email_restriction CHECK (
      (role = 'owner' AND email IN ('vijayadhithya.j@gmail.com', 'g3082492@gmail.com')) OR
      (role != 'owner')
    )
);

-- Pre-approved invites table
CREATE TABLE IF NOT EXISTS public.pending_invites (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('staff', 'team_leader', 'viewer')), -- Owners cannot invite new owners
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create tasks table
CREATE SEQUENCE IF NOT EXISTS tasks_serial_seq START 1001;

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number TEXT DEFAULT 'TSK-' || nextval('tasks_serial_seq'::regclass) NOT NULL,
    client_name TEXT NOT NULL,
    gst_number TEXT,
    pan_number TEXT,
    work_type TEXT NOT NULL,
    assigned_to_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    team_leader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    received_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')) DEFAULT 'pending',
    delay_reason TEXT,
    remarks TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create settings table (Singleton)
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY CHECK (id = 'general'),
    work_types TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert initial settings
INSERT INTO public.settings (id, work_types) 
VALUES ('general', ARRAY['GST monthly return filling', 'Income tax return filling', 'TDS', 'PAN'])
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check roles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Trigger to execute on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IN ('vijayadhithya.j@gmail.com', 'g3082492@gmail.com') THEN
    INSERT INTO public.users (id, email, name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'owner')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. RLS Policies

-- Users:
CREATE POLICY "Users viewable by everyone" ON public.users FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Owners manage all users" ON public.users FOR ALL USING (get_user_role() = 'owner') WITH CHECK (get_user_role() = 'owner');
CREATE POLICY "Self registration" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Self update name" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Settings: Only owner can manage
CREATE POLICY "Everyone can view settings" ON public.settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Owner manage settings" ON public.settings FOR ALL USING (get_user_role() = 'owner') WITH CHECK (get_user_role() = 'owner');

-- Tasks Visibility:
-- 1. Owners see everything
-- 2. Team Leaders see tasks they Lead or are assigned to
-- 3. Staff see tasks they are assigned to
CREATE POLICY "Task select policy"
  ON public.tasks FOR SELECT
  USING (
    get_user_role() = 'owner' OR
    auth.uid() = assigned_to_id OR
    auth.uid() = team_leader_id
  );

-- Task Creation: ONLY Owner
CREATE POLICY "Task insert policy"
  ON public.tasks FOR INSERT
  WITH CHECK (get_user_role() = 'owner');

-- Task Deletion: ONLY Owner
CREATE POLICY "Task delete policy"
  ON public.tasks FOR DELETE
  USING (get_user_role() = 'owner');

-- Task Update:
-- 1. Owners can update everything
-- 2. Team Leaders can update everything for their tasks
-- 3. Staff can ONLY update status, delay_reason, and remarks
CREATE POLICY "Task update policy"
  ON public.tasks FOR UPDATE
  USING (
    get_user_role() = 'owner' OR
    (get_user_role() = 'team_leader' AND (auth.uid() = team_leader_id OR auth.uid() = assigned_to_id)) OR
    (get_user_role() = 'staff' AND auth.uid() = assigned_to_id)
  )
  WITH CHECK (
    get_user_role() = 'owner' OR
    (get_user_role() = 'team_leader' AND (auth.uid() = team_leader_id OR auth.uid() = assigned_to_id)) OR
    (
      get_user_role() = 'staff' AND 
      auth.uid() = assigned_to_id AND
      -- Column level check via logic: compare with OLD values for restricted columns
      -- Note: In RLS WITH CHECK, column original vs new comparison is tricky without triggers.
      -- We will enforce the "information" restriction primarily in the UI, 
      -- while ensuring only relevant people have update access here.
      true
    )
  );

-- To strictly enforce column-level security for Staff on DB level, we add a trigger:
CREATE OR REPLACE FUNCTION public.check_staff_update_restriction()
RETURNS trigger AS $$
BEGIN
  IF public.get_user_role() = 'staff' AND NOT (public.get_user_role() = 'owner') THEN
    -- If they are staff, ensure "information" fields haven't changed
    IF NEW.client_name != OLD.client_name OR
       NEW.work_type != OLD.work_type OR
       NEW.received_date != OLD.received_date OR
       NEW.due_date != OLD.due_date OR
       COALESCE(NEW.gst_number, '') != COALESCE(OLD.gst_number, '') OR
       COALESCE(NEW.pan_number, '') != COALESCE(OLD.pan_number, '') OR
       NEW.assigned_to_id != OLD.assigned_to_id OR
       NEW.team_leader_id != OLD.team_leader_id
    THEN
      RAISE EXCEPTION 'Staff are only allowed to update status, delay reason, and remarks.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER staff_update_restriction_trigger
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.check_staff_update_restriction();
