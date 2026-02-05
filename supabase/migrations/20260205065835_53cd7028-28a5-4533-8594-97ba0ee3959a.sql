-- Create companies table
CREATE TABLE public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create company_memberships table to link users to companies with roles
CREATE TABLE public.company_memberships (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'hr_manager', 'employee')),
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;

-- Create invitation_codes table for single-use codes
CREATE TABLE public.invitation_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'hr_manager', 'employee')),
    created_by UUID NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- Create security definer functions for company role checks
CREATE OR REPLACE FUNCTION public.is_company_super_admin(_company_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships
    WHERE company_id = _company_id
      AND user_id = _user_id
      AND role = 'super_admin'
      AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_company_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships
    WHERE company_id = _company_id
      AND user_id = _user_id
      AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_companies(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.company_memberships
  WHERE user_id = _user_id
    AND is_active = true
$$;

-- RLS Policies for companies
CREATE POLICY "Users can view companies they belong to"
ON public.companies FOR SELECT
USING (is_company_member(id, auth.uid()));

CREATE POLICY "Users can create companies"
ON public.companies FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Super admins can update their companies"
ON public.companies FOR UPDATE
USING (is_company_super_admin(id, auth.uid()));

-- RLS Policies for company_memberships
CREATE POLICY "Users can view memberships of their companies"
ON public.company_memberships FOR SELECT
USING (company_id IN (SELECT public.get_user_companies(auth.uid())));

CREATE POLICY "Super admins can manage memberships"
ON public.company_memberships FOR ALL
USING (is_company_super_admin(company_id, auth.uid()));

CREATE POLICY "Users can insert their own membership"
ON public.company_memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for invitation_codes
CREATE POLICY "Super admins can manage invitation codes"
ON public.invitation_codes FOR ALL
USING (is_company_super_admin(company_id, auth.uid()));

CREATE POLICY "Anyone can view valid codes to join"
ON public.invitation_codes FOR SELECT
USING (is_used = false AND (expires_at IS NULL OR expires_at > now()));

-- Trigger for updated_at on companies
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();