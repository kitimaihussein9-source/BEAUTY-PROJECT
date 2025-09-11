-- Create admin account with specific credentials
-- Admin Email: ecokitaaloop@gmail.com
-- Admin Password: Admin@2024!

-- First, let's create a function to handle admin signup
CREATE OR REPLACE FUNCTION create_admin_account()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Insert admin user directly into auth.users (this bypasses email confirmation)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'ecokitaaloop@gmail.com',
    crypt('Admin@2024!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin User", "phone": "0614103439", "role": "admin"}',
    false,
    'authenticated'
  )
  RETURNING id INTO admin_user_id;

  -- Create profile for admin
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'ecokitaaloop@gmail.com',
    'Admin User',
    '0614103439',
    'admin',
    NOW(),
    NOW()
  );

  RETURN 'Admin account created successfully. Email: ecokitaaloop@gmail.com, Password: Admin@2024!';
END;
$$;

-- Execute the function to create admin account
SELECT create_admin_account();
