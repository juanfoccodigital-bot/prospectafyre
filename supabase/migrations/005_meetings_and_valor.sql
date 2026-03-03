-- Tabela de reuniões
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'agendada',
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_jid TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_meetings_scheduled ON public.meetings(scheduled_at);
CREATE INDEX idx_meetings_lead ON public.meetings(lead_id);
CREATE INDEX idx_meetings_created_by ON public.meetings(created_by);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access for authenticated" ON public.meetings
  FOR ALL USING (true) WITH CHECK (true);

-- Campo valor_fechamento nos leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS valor_fechamento NUMERIC;
