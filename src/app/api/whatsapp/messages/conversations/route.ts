import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jidToPhone, phoneToDisplay } from '@/lib/evolution/utils'
import type { Conversation } from '@/types'

export async function GET() {
  const supabase = await createClient()

  // Get all messages ordered by date desc to build conversation list
  const { data: messages, error } = await supabase
    .from('whatsapp_messages')
    .select('remote_jid, content, direction, created_at, lead_id')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!messages?.length) {
    return NextResponse.json([])
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
      convMap.set(msg.remote_jid, {
        remote_jid: msg.remote_jid,
        last_message: msg.content,
        last_message_at: msg.created_at,
        unread_count: 0,
        lead_id: msg.lead_id,
      })
    }
    // Count inbound messages as "unread" (simplified — no read tracking)
    if (msg.direction === 'inbound') {
      const conv = convMap.get(msg.remote_jid)!
      conv.unread_count++
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

  // Get tags for all jids
  const jids = [...convMap.keys()]
  const { data: tags } = await supabase
    .from('whatsapp_contact_tags')
    .select('remote_jid, tag')
    .in('remote_jid', jids)

  const tagsMap: Record<string, string[]> = {}
  tags?.forEach((t) => {
    if (!tagsMap[t.remote_jid]) tagsMap[t.remote_jid] = []
    tagsMap[t.remote_jid].push(t.tag)
  })

  const conversations: Conversation[] = [...convMap.values()].map((c) => ({
    remote_jid: c.remote_jid,
    phone: phoneToDisplay(jidToPhone(c.remote_jid)),
    last_message: c.last_message,
    last_message_at: c.last_message_at,
    unread_count: c.unread_count,
    lead: c.lead_id ? (leadsMap[c.lead_id] as Conversation['lead']) : null,
    tags: tagsMap[c.remote_jid] || [],
  }))

  // Sort by last message date
  conversations.sort((a, b) =>
    new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  )

  return NextResponse.json(conversations)
}
