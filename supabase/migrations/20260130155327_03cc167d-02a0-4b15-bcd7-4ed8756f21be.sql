
-- Create app_role enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nama TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create gejala (symptoms) table
CREATE TABLE public.gejala (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_gejala TEXT NOT NULL UNIQUE,
    nama_gejala TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on gejala
ALTER TABLE public.gejala ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gejala"
ON public.gejala FOR SELECT
USING (true);

CREATE POLICY "Admins can manage gejala"
ON public.gejala FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create kerusakan (damage types) table
CREATE TABLE public.kerusakan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_kerusakan TEXT NOT NULL UNIQUE,
    nama_kerusakan TEXT NOT NULL,
    solusi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on kerusakan
ALTER TABLE public.kerusakan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view kerusakan"
ON public.kerusakan FOR SELECT
USING (true);

CREATE POLICY "Admins can manage kerusakan"
ON public.kerusakan FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create rule table for expert system rules
CREATE TABLE public.rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_gejala TEXT NOT NULL REFERENCES public.gejala(kode_gejala) ON DELETE CASCADE,
    kode_kerusakan TEXT NOT NULL REFERENCES public.kerusakan(kode_kerusakan) ON DELETE CASCADE,
    cf DECIMAL(3,2) NOT NULL CHECK (cf >= 0 AND cf <= 1),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (kode_gejala, kode_kerusakan)
);

-- Enable RLS on rule
ALTER TABLE public.rule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rules"
ON public.rule FOR SELECT
USING (true);

CREATE POLICY "Admins can manage rules"
ON public.rule FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create konsultasi (consultation history) table
CREATE TABLE public.konsultasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tanggal TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    gejala_dipilih TEXT[] NOT NULL,
    hasil_kerusakan TEXT,
    nama_kerusakan TEXT,
    nilai_cf DECIMAL(5,4),
    solusi TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on konsultasi
ALTER TABLE public.konsultasi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consultations"
ON public.konsultasi FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create consultations"
ON public.konsultasi FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consultations"
ON public.konsultasi FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gejala_updated_at
BEFORE UPDATE ON public.gejala
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kerusakan_updated_at
BEFORE UPDATE ON public.kerusakan
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rule_updated_at
BEFORE UPDATE ON public.rule
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
