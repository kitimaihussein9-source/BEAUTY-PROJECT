-- Function to promote user to admin role
-- This should be called after ecokitaaloop@gmail.com signs up
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's role to admin
  UPDATE public.profiles 
  SET role = 'admin' 
  WHERE email = user_email;
  
  -- Check if update was successful
  IF FOUND THEN
    RETURN 'User promoted to admin successfully';
  ELSE
    RETURN 'User not found';
  END IF;
END;
$$;

-- Call this function after ecokitaaloop@gmail.com signs up:
-- SELECT promote_to_admin('ecokitaaloop@gmail.com');
