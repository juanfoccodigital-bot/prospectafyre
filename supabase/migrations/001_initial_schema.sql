-- ProspectaFyre Database Schema
-- Run this in Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cidade TEXT,
  estado TEXT,
  ddd TEXT,
  especialidade TEXT,
  faturamento NUMERIC,
  status TEXT NOT NULL DEFAULT 'novo',
  assigned_to UUID NOT NULL REFERENCES public.users(id),
  observacoes TEXT,
  ultimo_contato TIMESTAMPTZ,
  resposta BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interactions table
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  tipo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance with 5000+ leads
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_ddd ON public.leads(ddd);
CREATE INDEX IF NOT EXISTS idx_leads_estado ON public.leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_cidade ON public.leads(cidade);
CREATE INDEX IF NOT EXISTS idx_leads_especialidade ON public.leads(especialidade);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_nome_search ON public.leads USING gin(to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_interactions_lead ON public.interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON public.interactions(user_id);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Both users are admins, they can see everything
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view all leads" ON public.leads
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update leads" ON public.leads
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete leads" ON public.leads
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all interactions" ON public.interactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert interactions" ON public.interactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
