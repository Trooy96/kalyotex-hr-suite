-- Fix profiles table - recreate admin policy with proper WITH CHECK for INSERT
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix departments table - recreate admin policy with proper WITH CHECK for INSERT
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
CREATE POLICY "Admins can manage departments" 
ON public.departments 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix job_postings table - recreate admin policy with proper WITH CHECK for INSERT
DROP POLICY IF EXISTS "Admins can manage all job postings" ON public.job_postings;
CREATE POLICY "Admins can manage all job postings" 
ON public.job_postings 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));