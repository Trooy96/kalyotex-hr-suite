-- Remove foreign key constraint on profiles.user_id to allow admin-created employee profiles
-- This enables adding employees before they sign up

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Make user_id nullable for admin-created profiles (employees who haven't signed up yet)
ALTER TABLE public.profiles 
ALTER COLUMN user_id DROP NOT NULL;