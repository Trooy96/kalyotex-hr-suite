-- Employee contracts table
CREATE TABLE public.employee_contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contract_type TEXT NOT NULL DEFAULT 'permanent', -- permanent, fixed-term, probation, casual
    start_date DATE NOT NULL,
    end_date DATE,
    job_title TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    base_salary NUMERIC NOT NULL DEFAULT 0,
    housing_allowance NUMERIC DEFAULT 0,
    transport_allowance NUMERIC DEFAULT 0,
    lunch_allowance NUMERIC DEFAULT 0,
    other_allowances NUMERIC DEFAULT 0,
    allowances_description TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- active, expired, terminated
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Emergency contacts table
CREATE TABLE public.emergency_contacts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    email TEXT,
    address TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance reviews table
CREATE TABLE public.performance_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id),
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    performance_score NUMERIC CHECK (performance_score >= 0 AND performance_score <= 100),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    achievements TEXT,
    comments TEXT,
    employee_comments TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, submitted, acknowledged
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Statutory settings table (NAPSA, PAYE, NHIMA rates for Zambia)
CREATE TABLE public.statutory_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- napsa_employee, napsa_employer, nhima_employee, nhima_employer
    rate NUMERIC NOT NULL, -- percentage rate
    cap_amount NUMERIC, -- maximum amount if applicable
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PAYE tax brackets table
CREATE TABLE public.paye_brackets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    min_amount NUMERIC NOT NULL,
    max_amount NUMERIC,
    rate NUMERIC NOT NULL, -- percentage
    fixed_amount NUMERIC DEFAULT 0,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add allowances columns to payroll_records
ALTER TABLE public.payroll_records 
ADD COLUMN IF NOT EXISTS housing_allowance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS transport_allowance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lunch_allowance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_allowances NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_pay NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS napsa_employee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS napsa_employer NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS nhima_employee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS nhima_employer NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS paye NUMERIC DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.employee_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statutory_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paye_brackets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_contracts
CREATE POLICY "Admins can manage all contracts" ON public.employee_contracts
FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Managers can view team contracts" ON public.employee_contracts
FOR SELECT USING (is_manager(auth.uid()) AND is_manager_of_employee(employee_id, auth.uid()));

CREATE POLICY "Users can view their own contracts" ON public.employee_contracts
FOR SELECT USING (employee_id = get_profile_id(auth.uid()));

-- RLS Policies for emergency_contacts
CREATE POLICY "Admins can manage all emergency contacts" ON public.emergency_contacts
FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can manage their own emergency contacts" ON public.emergency_contacts
FOR ALL USING (employee_id = get_profile_id(auth.uid())) WITH CHECK (employee_id = get_profile_id(auth.uid()));

CREATE POLICY "Managers can view team emergency contacts" ON public.emergency_contacts
FOR SELECT USING (is_manager(auth.uid()) AND is_manager_of_employee(employee_id, auth.uid()));

-- RLS Policies for performance_reviews
CREATE POLICY "Admins can manage all reviews" ON public.performance_reviews
FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Managers can manage team reviews" ON public.performance_reviews
FOR ALL USING (is_manager(auth.uid()) AND is_manager_of_employee(employee_id, auth.uid()))
WITH CHECK (is_manager(auth.uid()) AND is_manager_of_employee(employee_id, auth.uid()));

CREATE POLICY "Users can view their own reviews" ON public.performance_reviews
FOR SELECT USING (employee_id = get_profile_id(auth.uid()));

CREATE POLICY "Users can add comments to their reviews" ON public.performance_reviews
FOR UPDATE USING (employee_id = get_profile_id(auth.uid()));

-- RLS Policies for statutory_settings (read-only for most, admin manages)
CREATE POLICY "Anyone can view statutory settings" ON public.statutory_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage statutory settings" ON public.statutory_settings
FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for paye_brackets
CREATE POLICY "Anyone can view PAYE brackets" ON public.paye_brackets
FOR SELECT USING (true);

CREATE POLICY "Admins can manage PAYE brackets" ON public.paye_brackets
FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Insert default Zambian statutory rates (2024)
INSERT INTO public.statutory_settings (name, rate, cap_amount, description) VALUES
('napsa_employee', 5.0, NULL, 'NAPSA Employee Contribution - 5% of gross salary'),
('napsa_employer', 5.0, NULL, 'NAPSA Employer Contribution - 5% of gross salary'),
('nhima_employee', 1.0, NULL, 'NHIMA Employee Contribution - 1% of gross salary'),
('nhima_employer', 1.0, NULL, 'NHIMA Employer Contribution - 1% of gross salary');

-- Insert Zambian PAYE brackets (2024)
INSERT INTO public.paye_brackets (min_amount, max_amount, rate, fixed_amount) VALUES
(0, 5100, 0, 0),
(5100.01, 7100, 20, 0),
(7100.01, 9200, 30, 400),
(9200.01, NULL, 37.5, 1030);

-- Triggers for updated_at
CREATE TRIGGER update_employee_contracts_updated_at
BEFORE UPDATE ON public.employee_contracts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_emergency_contacts_updated_at
BEFORE UPDATE ON public.emergency_contacts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_performance_reviews_updated_at
BEFORE UPDATE ON public.performance_reviews
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();