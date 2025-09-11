-- Fix admin account creation with proper password hashing
-- This ensures the admin can login with the specified credentials

-- First, delete any existing admin account to avoid conflicts
DELETE FROM auth.users WHERE email = 'ecokitaaloop@gmail.com';
DELETE FROM public.profiles WHERE email = 'ecokitaaloop@gmail.com';

-- Create admin user with proper Supabase auth structure
DO $$
DECLARE
  admin_user_id UUID := gen_random_uuid();
  hashed_password TEXT;
BEGIN
  -- Generate proper bcrypt hash for the password
  SELECT crypt('Admin@2024!', gen_salt('bf')) INTO hashed_password;
  
  -- Insert into auth.users with proper structure
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_user_id,
    'authenticated',
    'authenticated',
    'ecokitaaloop@gmail.com',
    hashed_password,
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin User", "phone": "0614103439"}',
    false,
    NOW(),
    NOW(),
    '0614103439',
    NOW(),
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL
  );

  -- Create profile for admin
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'ecokitaaloop@gmail.com',
    'Admin User',
    '0614103439',
    'admin',
    NULL,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Admin account created successfully!';
  RAISE NOTICE 'Email: ecokitaaloop@gmail.com';
  RAISE NOTICE 'Password: Admin@2024!';
END $$;
