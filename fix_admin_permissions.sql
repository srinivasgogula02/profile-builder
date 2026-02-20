-- 1. Ensure is_admin function exists and is secure
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

-- 2. Enable RLS on templates
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can insert templates" ON templates;
DROP POLICY IF EXISTS "Admins can update templates" ON templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON templates;
DROP POLICY IF EXISTS "Public can view templates" ON templates;

-- 4. Create policies
-- Everyone can view
CREATE POLICY "Public can view templates" 
ON templates FOR SELECT 
USING ( true );

-- Admins can do everything
CREATE POLICY "Admins can insert templates" 
ON templates FOR INSERT 
WITH CHECK ( is_admin() );

CREATE POLICY "Admins can update templates" 
ON templates FOR UPDATE 
USING ( is_admin() );

CREATE POLICY "Admins can delete templates" 
ON templates FOR DELETE 
USING ( is_admin() );
