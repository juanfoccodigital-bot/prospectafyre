import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { remoteJid, userId } = await req.json()

  if (!remoteJid || !userId) {
    return NextResponse.json({ error: 'remoteJid and userId are required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('conversation_reads')
    .upsert(
      {
        remote_jid: remoteJid,
        user_id: userId,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: 'remote_jid,user_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
