
-- 1. Employee Tasks table
CREATE TABLE public.employee_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id),
  department_id UUID REFERENCES public.departments(id),
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_tasks ENABLE ROW LEVEL SECURITY;

-- 2. Task assignments junction table (many employees per task)
CREATE TABLE public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.employee_tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, employee_id)
);

ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- 3. RLS for employee_tasks
CREATE POLICY "Admins can manage all tasks"
ON public.employee_tasks FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Managers can manage their tasks"
ON public.employee_tasks FOR ALL
USING (assigned_by = get_profile_id(auth.uid()) AND is_manager(auth.uid()))
WITH CHECK (assigned_by = get_profile_id(auth.uid()) AND is_manager(auth.uid()));

CREATE POLICY "Employees can view tasks assigned to them"
ON public.employee_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.task_assignments ta
    WHERE ta.task_id = employee_tasks.id
    AND ta.employee_id = get_profile_id(auth.uid())
  )
);

-- 4. RLS for task_assignments
CREATE POLICY "Admins can manage all assignments"
ON public.task_assignments FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Managers can manage assignments for their tasks"
ON public.task_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.employee_tasks et
    WHERE et.id = task_assignments.task_id
    AND et.assigned_by = get_profile_id(auth.uid())
    AND is_manager(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employee_tasks et
    WHERE et.id = task_assignments.task_id
    AND et.assigned_by = get_profile_id(auth.uid())
    AND is_manager(auth.uid())
  )
);

CREATE POLICY "Employees can view their assignments"
ON public.task_assignments FOR SELECT
USING (employee_id = get_profile_id(auth.uid()));

CREATE POLICY "Employees can update their assignments"
ON public.task_assignments FOR UPDATE
USING (employee_id = get_profile_id(auth.uid()));

-- 5. Documents: add assigned_to column for contract assignment
ALTER TABLE public.documents ADD COLUMN assigned_to UUID REFERENCES public.profiles(id);

-- Let assigned employees view documents assigned to them
CREATE POLICY "Employees can view documents assigned to them"
ON public.documents FOR SELECT
USING (assigned_to = get_profile_id(auth.uid()));

-- 6. Job postings: add is_public flag for website posting
ALTER TABLE public.job_postings ADD COLUMN is_public BOOLEAN DEFAULT false;

-- 7. Triggers for updated_at on new tables
CREATE TRIGGER update_employee_tasks_updated_at
BEFORE UPDATE ON public.employee_tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
