
-- 1. POLICIES FOR PROFILES TABLE

-- Allow users to see their own profile
CREATE POLICY "Allow individual user access to their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow individual user to update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);


-- 2. POLICIES FOR SERVICES TABLE

-- Allow anyone to view all services (public access)
CREATE POLICY "Allow public read access to services"
ON public.services FOR SELECT
USING (true);

-- Allow users with the 'provider' role to insert new services
CREATE POLICY "Allow providers to create services"
ON public.services FOR INSERT
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'provider');

-- Allow providers to update their own services
CREATE POLICY "Allow providers to update their own services"
ON public.services FOR UPDATE
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

-- Allow providers to delete their own services
CREATE POLICY "Allow providers to delete their own services"
ON public.services FOR DELETE
USING (auth.uid() = provider_id);


-- 3. POLICIES FOR APPOINTMENTS TABLE

-- Allow users to create appointments
CREATE POLICY "Allow authenticated users to create appointments"
ON public.appointments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow customers and providers to see their own appointments
CREATE POLICY "Allow related users to view their appointments"
ON public.appointments FOR SELECT
USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- Allow customers and providers to update their own appointments (e.g., to cancel)
CREATE POLICY "Allow related users to update their appointments"
ON public.appointments FOR UPDATE
USING (auth.uid() = customer_id OR auth.uid() = provider_id);


-- 4. POLICIES FOR PROVIDER APPLICATIONS TABLE

-- Allow users to create an application for themselves
CREATE POLICY "Allow users to create their own provider application"
ON public.provider_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to see their own application, and admins to see all applications
CREATE POLICY "Allow users to view own application, and admin to view all"
ON public.provider_applications FOR SELECT
USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Allow admins to update applications (to approve/reject them)
CREATE POLICY "Allow admins to update provider applications"
ON public.provider_applications FOR UPDATE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

