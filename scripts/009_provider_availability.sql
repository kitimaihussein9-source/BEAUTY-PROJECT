-- Create provider_availability table to store custom provider schedules
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, day_of_week) -- Ensures one entry per provider per day
);

-- Add a trigger to automatically update the updated_at timestamp
-- This trigger is now generic and can be reused
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists on the table to avoid errors on re-run
DROP TRIGGER IF EXISTS set_provider_availability_timestamp ON public.provider_availability;
-- Apply the trigger to the new table
CREATE TRIGGER set_provider_availability_timestamp
BEFORE UPDATE ON public.provider_availability
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Seed default availability for existing providers (Monday-Friday, 9am-5pm)
-- This makes the new system work for existing users without them having to set it up.
-- We use ON CONFLICT to avoid errors if a provider already has an entry for a specific day.
INSERT INTO public.provider_availability (provider_id, day_of_week, start_time, end_time, is_available)
SELECT
  p.id,
  day_num.day_of_week,
  '09:00:00'::TIME,
  '17:00:00'::TIME,
  true
FROM
  public.profiles p,
  generate_series(1, 5) AS day_num(day_of_week) -- Monday (1) to Friday (5)
WHERE
  p.role = 'provider'
ON CONFLICT (provider_id, day_of_week) DO NOTHING;
