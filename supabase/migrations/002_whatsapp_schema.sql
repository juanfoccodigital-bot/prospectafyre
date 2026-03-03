-- ============================================
-- WhatsApp Integration Tables
-- ============================================

-- Ensure update_updated_at() function exists (defined in 001 but may be missing)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- WhatsApp instances (Evolution API connections)
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL UNIQUE,
  instance_id TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  owner_phone TEXT,
  webhook_url TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WhatsApp messages
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL,
  remote_jid TEXT NOT NULL,
  message_id TEXT UNIQUE,
  direction TEXT NOT NULL,
  content TEXT,
  media_type TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  file_name TEXT,
  status TEXT DEFAULT 'sent',
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wpp_messages_remote_jid ON public.whatsapp_messages(remote_jid);
CREATE INDEX IF NOT EXISTS idx_wpp_messages_lead ON public.whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_wpp_messages_created ON public.whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wpp_messages_instance ON public.whatsapp_messages(instance_name);

-- Message templates
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'geral',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact tags
CREATE TABLE IF NOT EXISTS public.whatsapp_contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remote_jid TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(remote_jid, tag)
);

CREATE INDEX IF NOT EXISTS idx_wpp_tags_jid ON public.whatsapp_contact_tags(remote_jid);

-- Trigger for updated_at on whatsapp_instances
CREATE TRIGGER whatsapp_instances_updated_at
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS policies (full access for authenticated users)
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_full_whatsapp_instances" ON public.whatsapp_instances FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_full_whatsapp_messages" ON public.whatsapp_messages FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_full_whatsapp_templates" ON public.whatsapp_templates FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_full_whatsapp_tags" ON public.whatsapp_contact_tags FOR ALL USING (auth.uid() IS NOT NULL);
