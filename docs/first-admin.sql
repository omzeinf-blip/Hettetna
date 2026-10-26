-- Create the FIRST admin. Run manually in the Supabase SQL editor AFTER the migration.
-- Prerequisites (Supabase dashboard):
--   1. Authentication > Users > Add user: create the staff user with email + password
--      (tick "Auto Confirm User").
--   2. In Auth settings, turn OFF "Allow new users to sign up" so nobody can self-register.
-- Replace the two placeholders below. Nothing secret is stored in this file.

insert into public.staff_profiles (user_id, role, full_name)
select id, 'admin', 'REPLACE WITH FULL NAME'
from auth.users
where email = 'REPLACE-WITH-ADMIN-EMAIL';

-- Expect: INSERT 0 1. If it says INSERT 0 0 the email did not match a user.
-- Later staff (agents): same statement with role 'agent'.
