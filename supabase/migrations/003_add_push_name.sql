-- Add push_name column to store WhatsApp contact display names
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS push_name TEXT;

-- Create contacts cache table for profile pics and names
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  remote_jid TEXT PRIMARY KEY,
  push_name TEXT,
  profile_pic_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_full_whatsapp_contacts" ON public.whatsapp_contacts FOR ALL USING (true);
