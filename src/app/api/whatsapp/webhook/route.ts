import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { jidToPhone } from '@/lib/evolution/utils'

// Public endpoint — no auth middleware
// Uses service-level Supabase client (no cookies needed)
function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

export async function POST(req: Request) {
  const body = await req.json()
  const event = body.event
  const instanceName = body.instance

  const supabase = getSupabase()

  try {
    if (event === 'messages.upsert') {
      await handleMessagesUpsert(supabase, instanceName, body.data)
    } else if (event === 'messages.update') {
      await handleMessagesUpdate(supabase, body.data)
    } else if (event === 'connection.update') {
      await handleConnectionUpdate(supabase, instanceName, body.data)
    }
  } catch (err) {
    console.error(`Webhook error (${event}):`, err)
  }

  return NextResponse.json({ ok: true })
}

async function handleMessagesUpsert(
  supabase: ReturnType<typeof getSupabase>,
  instanceName: string,
  data: Record<string, unknown>
) {
  const key = data.key as Record<string, unknown> | undefined
  if (!key) return

  const remoteJid = key.remoteJid as string
  if (!remoteJid || remoteJid.includes('@g.us')) return // Skip group messages

  const fromMe = key.fromMe as boolean
  const messageId = key.id as string
  const direction = fromMe ? 'outbound' : 'inbound'

  // Extract message content
  const message = data.message as Record<string, unknown> | undefined
  let content: string | null = null
  let mediaType: string | null = null
  let mediaUrl: string | null = null
  let mediaMimeType: string | null = null
  let fileName: string | null = null

  if (message) {
    // Text message
    content = (message.conversation as string) ||
      (message.extendedTextMessage as Record<string, unknown>)?.text as string ||
      null

    // Image
    if (message.imageMessage) {
      const img = message.imageMessage as Record<string, unknown>
      mediaType = 'image'
      content = (img.caption as string) || content
      mediaMimeType = img.mimetype as string || null
      mediaUrl = img.base64 as string || img.url as string || null
    }

    // Video
    if (message.videoMessage) {
      const vid = message.videoMessage as Record<string, unknown>
      mediaType = 'video'
      content = (vid.caption as string) || content
      mediaMimeType = vid.mimetype as string || null
      mediaUrl = vid.base64 as string || vid.url as string || null
    }

    // Audio
    if (message.audioMessage) {
      const aud = message.audioMessage as Record<string, unknown>
      mediaType = 'audio'
      mediaMimeType = aud.mimetype as string || null
      mediaUrl = aud.base64 as string || aud.url as string || null
    }

    // Document
    if (message.documentMessage) {
      const doc = message.documentMessage as Record<string, unknown>
      mediaType = 'document'
      fileName = doc.fileName as string || null
      mediaMimeType = doc.mimetype as string || null
      mediaUrl = doc.base64 as string || doc.url as string || null
      content = (doc.caption as string) || content
    }
  }

  // Auto-link to lead
  const phone = jidToPhone(remoteJid)
  const phoneDigits = phone.replace(/^55/, '')
  let leadId: string | null = null

  if (phoneDigits.length >= 8) {
    const { data: leads } = await supabase
      .from('leads')
      .select('id, ddd, telefone')
      .limit(1000)

    if (leads) {
      const match = leads.find((l: Record<string, unknown>) => {
        const lp = (((l.ddd as string) || '') + ((l.telefone as string) || '')).replace(/\D/g, '')
        return lp && phoneDigits.endsWith(lp)
      })
      if (match) leadId = match.id as string
    }
  }

  // Upsert message (avoid duplicates)
  await supabase.from('whatsapp_messages').upsert(
    {
      instance_name: instanceName,
      remote_jid: remoteJid,
      message_id: messageId,
      direction,
      content,
      media_type: mediaType,
      media_url: mediaUrl,
      media_mime_type: mediaMimeType,
      file_name: fileName,
      status: fromMe ? 'sent' : 'delivered',
      lead_id: leadId,
    },
    { onConflict: 'message_id' }
  )
}

async function handleMessagesUpdate(
  supabase: ReturnType<typeof getSupabase>,
  data: Record<string, unknown>
) {
  const key = data.key as Record<string, unknown> | undefined
  if (!key) return

  const messageId = key.id as string
  const update = data.update as Record<string, unknown> | undefined
  if (!messageId || !update) return

  const status = update.status as number | undefined
  if (!status) return

  // WhatsApp status codes: 2=sent, 3=delivered, 4=read
  const statusMap: Record<number, string> = { 2: 'sent', 3: 'delivered', 4: 'read' }
  const newStatus = statusMap[status]
  if (!newStatus) return

  await supabase
    .from('whatsapp_messages')
    .update({ status: newStatus })
    .eq('message_id', messageId)
}

async function handleConnectionUpdate(
  supabase: ReturnType<typeof getSupabase>,
  instanceName: string,
  data: Record<string, unknown>
) {
  const state = data.state as string | undefined
  if (!state) return

  const status = state === 'open' ? 'connected' : state === 'connecting' ? 'connecting' : 'disconnected'

  await supabase
    .from('whatsapp_instances')
    .update({ status })
    .eq('instance_name', instanceName)
}
