-- Create maintenance table
CREATE TABLE public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10,2),
  provider TEXT,
  status TEXT DEFAULT 'scheduled',
  scheduled_date DATE,
  completed_date DATE,
  mileage INTEGER,
  notes TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all maintenance"
  ON public.maintenance FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert maintenance"
  ON public.maintenance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update maintenance they own"
  ON public.maintenance FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete maintenance they own"
  ON public.maintenance FOR DELETE
  USING (auth.uid() = user_id);

-- Create fuel table
CREATE TABLE public.fuel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  fuel_type TEXT,
  volume DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  mileage INTEGER NOT NULL,
  station TEXT,
  notes TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.fuel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all fuel"
  ON public.fuel FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert fuel"
  ON public.fuel FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update fuel they own"
  ON public.fuel FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete fuel they own"
  ON public.fuel FOR DELETE
  USING (auth.uid() = user_id);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  file_url TEXT,
  notes TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all documents"
  ON public.documents FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update documents they own"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete documents they own"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create tours table
CREATE TABLE public.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  start_mileage INTEGER,
  end_mileage INTEGER,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all tours"
  ON public.tours FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert tours"
  ON public.tours FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update tours they own"
  ON public.tours FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete tours they own"
  ON public.tours FOR DELETE
  USING (auth.uid() = user_id);

-- Create inspections table
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  mileage INTEGER,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all inspections"
  ON public.inspections FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert inspections"
  ON public.inspections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update inspections they own"
  ON public.inspections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete inspections they own"
  ON public.inspections FOR DELETE
  USING (auth.uid() = user_id);

-- Create inspection_items table
CREATE TABLE public.inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  status TEXT NOT NULL,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all inspection_items"
  ON public.inspection_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert inspection_items"
  ON public.inspection_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update inspection_items"
  ON public.inspection_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete inspection_items"
  ON public.inspection_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Create alert_rules table
CREATE TABLE public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  condition JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert_rules"
  ON public.alert_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert alert_rules"
  ON public.alert_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert_rules"
  ON public.alert_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alert_rules"
  ON public.alert_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Update triggers
CREATE TRIGGER update_maintenance_updated_at
  BEFORE UPDATE ON public.maintenance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fuel_updated_at
  BEFORE UPDATE ON public.fuel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tours_updated_at
  BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();