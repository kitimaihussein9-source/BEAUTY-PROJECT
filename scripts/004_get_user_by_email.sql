CREATE OR REPLACE FUNCTION get_user_by_email(user_email TEXT)
RETURNS TABLE (user_id UUID)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id FROM auth.users WHERE email = user_email;
$$;