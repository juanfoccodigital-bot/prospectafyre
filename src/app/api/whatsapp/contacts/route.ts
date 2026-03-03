import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { phoneToJid, jidToPhone } from '@/lib/evolution/utils'
import type { WhatsAppContact, Lead } from '@/types'

export async function GET() {
  const supabase = await createClient()

  const { data: contacts, error } = await supabase
    .from('whatsapp_contacts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!contacts?.length) {
    return NextResponse.json([])
  }

  // Get tags for all contacts
  const jids = contacts.map((c) => c.remote_jid)
  const { data: tags } = await supabase
    .from('whatsapp_contact_tags')
    .select('remote_jid, tag')
    .in('remote_jid', jids)

  const tagsMap: Record<string, string[]> = {}
  tags?.forEach((t) => {
    if (!tagsMap[t.remote_jid]) tagsMap[t.remote_jid] = []
    tagsMap[t.remote_jid].push(t.tag)
  })

  // Match leads by phone
  const { data: leads } = await supabase
    .from('leads')
    .select('id, nome, especialidade, status, ddd, telefone')
    .limit(1000)

  const result: WhatsAppContact[] = contacts.map((c) => {
    const phone = jidToPhone(c.remote_jid)
    const phoneDigits = phone.replace(/^55/, '')

    let lead: Lead | null = null
    if (leads && phoneDigits.length >= 8) {
      const match = leads.find((l) => {
        const lp = ((l.ddd || '') + (l.telefone || '')).replace(/\D/g, '')
        return lp && phoneDigits.endsWith(lp)
      })
      if (match) lead = match as Lead
    }

    return {
      remote_jid: c.remote_jid,
      push_name: c.push_name,
      nome: c.nome,
      profile_pic_url: c.profile_pic_url,
      observacoes: c.observacoes,
      archived: c.archived ?? false,
      created_manually: c.created_manually ?? false,
      updated_at: c.updated_at,
      tags: tagsMap[c.remote_jid] || [],
      lead,
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const { phone, nome } = await req.json()

  if (!phone) {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 })
  }

  const digits = phone.replace(/\D/g, '')
  const fullPhone = digits.startsWith('55') ? digits : `55${digits}`
  const remoteJid = phoneToJid(fullPhone)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .upsert(
      {
        remote_jid: remoteJid,
        nome: nome || null,
        created_manually: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'remote_jid' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { remoteJid, nome, observacoes } = body

  if (!remoteJid) {
    return NextResponse.json({ error: 'remoteJid is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (nome !== undefined) updates.nome = nome
  if (observacoes !== undefined) updates.observacoes = observacoes
  if (body.archived !== undefined) updates.archived = body.archived

  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .update(updates)
    .eq('remote_jid', remoteJid)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const { remoteJid } = await req.json()

  if (!remoteJid) {
    return NextResponse.json({ error: 'remoteJid is required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Delete tags first
  await supabase
    .from('whatsapp_contact_tags')
    .delete()
    .eq('remote_jid', remoteJid)

  const { error } = await supabase
    .from('whatsapp_contacts')
    .delete()
    .eq('remote_jid', remoteJid)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
