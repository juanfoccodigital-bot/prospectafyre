-- Archive columns
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.whatsapp_contacts ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Conversation reads tracking (marks when user last read a conversation)
CREATE TABLE IF NOT EXISTS public.conversation_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remote_jid TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(remote_jid, user_id)
);

CREATE INDEX idx_conversation_reads_jid ON public.conversation_reads(remote_jid);
ALTER TABLE public.conversation_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access for authenticated" ON public.conversation_reads
  FOR ALL USING (true) WITH CHECK (true);
