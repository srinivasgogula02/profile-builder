-- 1. Create a secure function to check admin status
-- SECURITY DEFINER allows this function to bypass RLS when checking the table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE user_id = auth.uid()
    AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the problematic recursive policies on 'profiles'
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update users" ON profiles;

-- 3. Re-create policies using the safe function
-- Allow users to view their OWN profile AND Admins to view ALL
CREATE POLICY "Users can view own profile and Admins view all"
ON profiles
FOR SELECT
USING (
  auth.uid() = user_id OR is_admin()
);

-- Allow Admins to update any profile (and users to update own? usually yes, but let's stick to admin req for now unless existing policy covers owner)
-- Assuming there might be an existing "Users can update own profile" policy. 
-- If not, we should probably add one or ensure this doesn't conflict.
-- For now, let's just fix the Admin one.
CREATE POLICY "Admins can update any profile"
ON profiles
FOR UPDATE
USING (
  is_admin()
);

-- 4. Update 'templates' policies to be cleaner (optional but good practice)
DROP POLICY IF EXISTS "Admins can insert templates" ON templates;
DROP POLICY IF EXISTS "Admins can update templates" ON templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON templates;

CREATE POLICY "Admins can insert templates" ON templates FOR INSERT WITH CHECK ( is_admin() );
CREATE POLICY "Admins can update templates" ON templates FOR UPDATE USING ( is_admin() );
CREATE POLICY "Admins can delete templates" ON templates FOR DELETE USING ( is_admin() );
