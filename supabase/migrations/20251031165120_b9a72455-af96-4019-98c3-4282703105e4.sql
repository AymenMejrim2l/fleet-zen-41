-- Create notifications settings table
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  maintenance_days_before INTEGER DEFAULT 7,
  document_days_before INTEGER DEFAULT 30,
  fuel_consumption_threshold NUMERIC DEFAULT 20.0,
  email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notification settings"
ON public.notification_settings
FOR ALL
USING (auth.uid() = user_id);

-- Create analytics table for cost tracking
CREATE TABLE public.analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  total_fuel_cost NUMERIC DEFAULT 0,
  total_maintenance_cost NUMERIC DEFAULT 0,
  total_distance INTEGER DEFAULT 0,
  cost_per_km NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, period_start, period_end, vehicle_id, driver_id)
);

ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their analytics"
ON public.analytics_cache
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their analytics"
ON public.analytics_cache
FOR ALL
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check for upcoming maintenance
CREATE OR REPLACE FUNCTION public.check_upcoming_maintenance()
RETURNS TABLE (
  vehicle_id UUID,
  vehicle_name TEXT,
  days_until_maintenance INTEGER,
  scheduled_date DATE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.vehicle_id,
    v.make || ' ' || v.model AS vehicle_name,
    (m.scheduled_date - CURRENT_DATE) AS days_until_maintenance,
    m.scheduled_date
  FROM maintenance m
  JOIN vehicles v ON v.id = m.vehicle_id
  WHERE m.status = 'scheduled'
    AND m.scheduled_date >= CURRENT_DATE
    AND m.scheduled_date <= CURRENT_DATE + INTERVAL '30 days'
    AND auth.uid() = m.user_id
  ORDER BY m.scheduled_date;
$$;

-- Create function to check expiring documents
CREATE OR REPLACE FUNCTION public.check_expiring_documents()
RETURNS TABLE (
  document_id UUID,
  title TEXT,
  entity_type TEXT,
  expiry_date DATE,
  days_until_expiry INTEGER
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id AS document_id,
    d.title,
    d.entity_type,
    d.expiry_date,
    (d.expiry_date - CURRENT_DATE) AS days_until_expiry
  FROM documents d
  WHERE d.expiry_date IS NOT NULL
    AND d.expiry_date >= CURRENT_DATE
    AND d.expiry_date <= CURRENT_DATE + INTERVAL '60 days'
    AND auth.uid() = d.user_id
  ORDER BY d.expiry_date;
$$;