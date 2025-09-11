-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Services policies
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Providers can manage own services" ON public.services FOR ALL USING (
  provider_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('provider', 'admin'))
);
CREATE POLICY "Admins can manage all services" ON public.services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Provider applications policies
CREATE POLICY "Users can view own applications" ON public.provider_applications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own applications" ON public.provider_applications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all applications" ON public.provider_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update applications" ON public.provider_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (
  customer_id = auth.uid() OR provider_id = auth.uid()
);
CREATE POLICY "Customers can create appointments" ON public.appointments FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (
  customer_id = auth.uid() OR provider_id = auth.uid()
);
CREATE POLICY "Admins can view all appointments" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers can create reviews for their appointments" ON public.reviews FOR INSERT WITH CHECK (
  customer_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.appointments WHERE id = appointment_id AND customer_id = auth.uid() AND status = 'completed')
);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (customer_id = auth.uid());
