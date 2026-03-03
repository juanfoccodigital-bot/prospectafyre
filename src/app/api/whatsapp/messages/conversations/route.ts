import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jidToPhone, phoneToDisplay } from '@/lib/evolution/utils'
import type { Conversation } from '@/types'

export async function GET() {
  const supabase = await createClient()

  // Get current user for read tracking
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: messages, error } = await supabase
    .from('whatsapp_messages')
    .select('remote_jid, content, direction, created_at, lead_id, media_type')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!messages?.length) {
    return NextResponse.json([])
  }

  // Get conversation read timestamps
  const readsMap: Record<string, string> = {}
  if (authUser) {
    const { data: reads } = await supabase
      .from('conversation_reads')
      .select('remote_jid, last_read_at')
      .eq('user_id', authUser.id)

    reads?.forEach((r) => {
      readsMap[r.remote_jid] = r.last_read_at
    })
  }

  // Group by remote_jid
  const convMap = new Map<string, {
    remote_jid: string
    last_message: string | null
    last_message_at: string
    unread_count: number
    lead_id: string | null
  }>()

  for (const msg of messages) {
    if (!convMap.has(msg.remote_jid)) {
      // Build last message preview
      let preview = msg.content
      if (!preview && msg.media_type) {
        const mediaLabels: Record<string, string> = {
          image: 'Imagem', video: 'Vídeo', audio: 'Áudio', document: 'Documento',
        }
        preview = mediaLabels[msg.media_type] || 'Mídia'
      }
      convMap.set(msg.remote_jid, {
        remote_jid: msg.remote_jid,
        last_message: preview,
        last_message_at: msg.created_at,
        unread_count: 0,
        lead_id: msg.lead_id,
      })
    }
    // Only count inbound messages that arrived after last_read_at
    if (msg.direction === 'inbound') {
      const lastRead = readsMap[msg.remote_jid]
      if (!lastRead || new Date(msg.created_at) > new Date(lastRead)) {
        const conv = convMap.get(msg.remote_jid)!
        conv.unread_count++
      }
    }
  }

  // Get linked leads
  const leadIds = [...new Set([...convMap.values()].map((c) => c.lead_id).filter(Boolean))] as string[]
  let leadsMap: Record<string, unknown> = {}

  if (leadIds.length) {
    const { data: leads } = await supabase
      .from('leads')
      .select('id, nome, especialidade, status, ddd, telefone')
      .in('id', leadIds)
    if (leads) {
      leadsMap = Object.fromEntries(leads.map((l) => [l.id, l]))
    }
  }

  // Get contact names from cache
  const jids = [...convMap.keys()]
  const { data: contacts } = await supabase
    .from('whatsapp_contacts')
    .select('remote_jid, push_name, profile_pic_url')
    .in('remote_jid', jids)

  const contactsMap: Record<string, { push_name: string | null; profile_pic_url: string | null }> = {}
  contacts?.forEach((c) => {
    contactsMap[c.remote_jid] = { push_name: c.push_name, profile_pic_url: c.profile_pic_url }
  })

  // Get tags
  const { data: tags } = await supabase
    .from('whatsapp_contact_tags')
    .select('remote_jid, tag')
    .in('remote_jid', jids)

  const tagsMap: Record<string, string[]> = {}
  tags?.forEach((t) => {
    if (!tagsMap[t.remote_jid]) tagsMap[t.remote_jid] = []
    tagsMap[t.remote_jid].push(t.tag)
  })

  const conversations: Conversation[] = [...convMap.values()].map((c) => {
    const contact = contactsMap[c.remote_jid]
    const lead = c.lead_id ? (leadsMap[c.lead_id] as Conversation['lead']) : null
    return {
      remote_jid: c.remote_jid,
      phone: phoneToDisplay(jidToPhone(c.remote_jid)),
      contact_name: lead?.nome || contact?.push_name || null,
      profile_pic_url: contact?.profile_pic_url || null,
      last_message: c.last_message,
      last_message_at: c.last_message_at,
      unread_count: c.unread_count,
      lead,
      tags: tagsMap[c.remote_jid] || [],
    }
  })

  conversations.sort((a, b) =>
    new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  )

  return NextResponse.json(conversations)
}
