-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'commercial', 'conducteur', 'direction');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create permissions table for granular access control
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  resource TEXT NOT NULL, -- vehicles, drivers, maintenance, fuel, documents, tours, inspections, reports
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (role, resource)
);

-- Enable RLS on permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Create security definer function to check permission
CREATE OR REPLACE FUNCTION public.check_permission(_user_id UUID, _resource TEXT, _action TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.permissions p ON p.role = ur.role
    WHERE ur.user_id = _user_id
      AND p.resource = _resource
      AND (
        (_action = 'view' AND p.can_view = true) OR
        (_action = 'create' AND p.can_create = true) OR
        (_action = 'update' AND p.can_update = true) OR
        (_action = 'delete' AND p.can_delete = true)
      )
  ) OR public.is_admin(_user_id)
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for permissions
CREATE POLICY "Admins can manage all permissions"
ON public.permissions
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "All authenticated users can view permissions"
ON public.permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert default permissions for all roles
INSERT INTO public.permissions (role, resource, can_view, can_create, can_update, can_delete) VALUES
-- Admin: full access to everything
('admin', 'vehicles', true, true, true, true),
('admin', 'drivers', true, true, true, true),
('admin', 'maintenance', true, true, true, true),
('admin', 'fuel', true, true, true, true),
('admin', 'documents', true, true, true, true),
('admin', 'tours', true, true, true, true),
('admin', 'inspections', true, true, true, true),
('admin', 'reports', true, true, true, true),

-- Commercial: view all, manage tours and documents
('commercial', 'vehicles', true, false, false, false),
('commercial', 'drivers', true, false, false, false),
('commercial', 'maintenance', true, false, false, false),
('commercial', 'fuel', true, false, false, false),
('commercial', 'documents', true, true, true, false),
('commercial', 'tours', true, true, true, false),
('commercial', 'inspections', true, false, false, false),
('commercial', 'reports', true, false, false, false),

-- Conducteur: view assigned tours, add fuel and inspections
('conducteur', 'vehicles', true, false, false, false),
('conducteur', 'drivers', false, false, false, false),
('conducteur', 'maintenance', true, false, false, false),
('conducteur', 'fuel', true, true, false, false),
('conducteur', 'documents', true, false, false, false),
('conducteur', 'tours', true, false, true, false),
('conducteur', 'inspections', true, true, true, false),
('conducteur', 'reports', false, false, false, false),

-- Direction: view everything, no modifications
('direction', 'vehicles', true, false, false, false),
('direction', 'drivers', true, false, false, false),
('direction', 'maintenance', true, false, false, false),
('direction', 'fuel', true, false, false, false),
('direction', 'documents', true, false, false, false),
('direction', 'tours', true, false, false, false),
('direction', 'inspections', true, false, false, false),
('direction', 'reports', true, false, false, false);