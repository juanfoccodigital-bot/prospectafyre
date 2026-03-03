-- Add extra fields to whatsapp_contacts for manual contact creation
ALTER TABLE public.whatsapp_contacts
  ADD COLUMN IF NOT EXISTS nome TEXT,
  ADD COLUMN IF NOT EXISTS observacoes TEXT,
  ADD COLUMN IF NOT EXISTS created_manually BOOLEAN NOT NULL DEFAULT FALSE;
