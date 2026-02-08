-- Allow admins and managers to delete job postings they posted
CREATE POLICY "Managers can delete their job postings"
ON public.job_postings
FOR DELETE
USING (posted_by = get_profile_id(auth.uid()) OR is_admin(auth.uid()));

-- Allow admins and managers to delete applications for their postings
CREATE POLICY "Managers can delete applications for their postings"
ON public.job_applications
FOR DELETE
USING (EXISTS (
  SELECT 1
  FROM job_postings
  WHERE job_postings.id = job_applications.job_id
    AND (job_postings.posted_by = get_profile_id(auth.uid()) OR is_admin(auth.uid()))
));