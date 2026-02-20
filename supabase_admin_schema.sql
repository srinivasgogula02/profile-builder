-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Policy to allow admins to view all profiles (for the Admin Users page)
-- Note: You might need to adjust existing policies if they conflict.
-- This assumes RLS is enabled on 'profiles'.

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (
  (SELECT is_admin FROM profiles WHERE user_id = auth.uid()) = TRUE
);

CREATE POLICY "Admins can update users"
ON profiles
FOR UPDATE
USING (
  (SELECT is_admin FROM profiles WHERE user_id = auth.uid()) = TRUE
);
