-- Create templates table
create table if not exists templates (
  id text primary key,
  name text not null,
  description text,
  thumbnail text,
  features text[],
  category text, 
  dimensions jsonb, -- {width, height}
  html text not null, -- Storing HTML content directly
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table templates enable row level security;

-- Policies
-- 1. Public Read Access (for Gallery and Editor)
create policy "Templates are public viewable"
  on templates for select
  using ( true );

-- 2. Admin Full Access (Insert/Update/Delete)
create policy "Admins can insert templates"
  on templates for insert
  with check (
    (select is_admin from profiles where user_id = auth.uid()) = true
  );

create policy "Admins can update templates"
  on templates for update
  using (
    (select is_admin from profiles where user_id = auth.uid()) = true
  );

create policy "Admins can delete templates"
  on templates for delete
  using (
    (select is_admin from profiles where user_id = auth.uid()) = true
  );
