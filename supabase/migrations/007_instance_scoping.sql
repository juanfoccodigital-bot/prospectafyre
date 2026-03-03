-- Add instance_name to contacts for per-instance scoping
ALTER TABLE public.whatsapp_contacts
  ADD COLUMN IF NOT EXISTS instance_name TEXT;

-- Backfill existing contacts with instance from their most recent message
UPDATE public.whatsapp_contacts c
SET instance_name = (
  SELECT m.instance_name FROM public.whatsapp_messages m
  WHERE m.remote_jid = c.remote_jid
  ORDER BY m.created_at DESC LIMIT 1
);
