import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const remoteJid = searchParams.get('remoteJid')
  if (!remoteJid) {
    return NextResponse.json({ error: 'remoteJid required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_contact_tags')
    .select('*')
    .eq('remote_jid', remoteJid)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const { remoteJid, tag } = await req.json()
  if (!remoteJid || !tag) {
    return NextResponse.json({ error: 'remoteJid and tag required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_contact_tags')
    .upsert({ remote_jid: remoteJid, tag }, { onConflict: 'remote_jid,tag' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const { remoteJid, tag } = await req.json()
  if (!remoteJid || !tag) {
    return NextResponse.json({ error: 'remoteJid and tag required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_contact_tags')
    .delete()
    .eq('remote_jid', remoteJid)
    .eq('tag', tag)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
