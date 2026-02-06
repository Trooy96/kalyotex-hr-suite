-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins can update their companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view companies they belong to" ON public.companies;

-- Recreate as PERMISSIVE policies (default behavior)
CREATE POLICY "Users can create companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Super admins can update their companies" 
ON public.companies 
FOR UPDATE 
TO authenticated
USING (is_company_super_admin(id, auth.uid()));

CREATE POLICY "Users can view companies they belong to" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (is_company_member(id, auth.uid()));

-- Also fix company_memberships policies
DROP POLICY IF EXISTS "Super admins can manage memberships" ON public.company_memberships;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.company_memberships;
DROP POLICY IF EXISTS "Users can view memberships of their companies" ON public.company_memberships;

CREATE POLICY "Super admins can manage memberships" 
ON public.company_memberships 
FOR ALL 
TO authenticated
USING (is_company_super_admin(company_id, auth.uid()));

CREATE POLICY "Users can insert their own membership" 
ON public.company_memberships 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view memberships of their companies" 
ON public.company_memberships 
FOR SELECT 
TO authenticated
USING (company_id IN (SELECT get_user_companies(auth.uid())));