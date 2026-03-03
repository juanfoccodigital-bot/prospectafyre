import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { jidToPhone } from '@/lib/evolution/utils'

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

// Event name mapping: Evolution sends UPPER_SNAKE via URL, dot.notation in body
const EVENT_MAP: Record<string, string> = {
  'MESSAGES_UPSERT': 'messages.upsert',
  'MESSAGES_UPDATE': 'messages.update',
  'CONNECTION_UPDATE': 'connection.update',
  'QRCODE_UPDATED': 'qrcode.updated',
  'SEND_MESSAGE': 'send.message',
}

export function normalizeEvent(event: string | undefined, urlSegment?: string): string | undefined {
  if (event) return event
  if (urlSegment) return EVENT_MAP[urlSegment.toUpperCase()] || urlSegment.toLowerCase().replace(/_/g, '.')
  return undefined
}

export async function handleWebhook(body: Record<string, unknown>, eventOverride?: string) {
  const event = normalizeEvent(body.event as string | undefined, eventOverride)
  const instanceName = (body.instance as string) || ''

  const supabase = getSupabase()

  try {
    if (event === 'messages.upsert') {
      await handleMessagesUpsert(supabase, instanceName, body.data as Record<string, unknown>)
    } else if (event === 'messages.update') {
      await handleMessagesUpdate(supabase, body.data as Record<string, unknown>)
    } else if (event === 'connection.update') {
      await handleConnectionUpdate(supabase, instanceName, body.data as Record<string, unknown>)
    }
  } catch (err) {
    console.error(`Webhook error (${event}):`, err)
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  await handleWebhook(body)
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
  if (!remoteJid || remoteJid.includes('@g.us')) return

  const fromMe = key.fromMe as boolean
  const messageId = key.id as string
  const direction = fromMe ? 'outbound' : 'inbound'
  const pushName = data.pushName as string | undefined

  const message = data.message as Record<string, unknown> | undefined
  let content: string | null = null
  let mediaType: string | null = null
  let mediaUrl: string | null = null
  let mediaMimeType: string | null = null
  let fileName: string | null = null

  if (message) {
    content = (message.conversation as string) ||
      (message.extendedTextMessage as Record<string, unknown>)?.text as string ||
      null

    if (message.imageMessage) {
      const img = message.imageMessage as Record<string, unknown>
      mediaType = 'image'
      content = (img.caption as string) || content
      mediaMimeType = img.mimetype as string || null
      mediaUrl = img.base64 as string || null
    }

    if (message.videoMessage) {
      const vid = message.videoMessage as Record<string, unknown>
      mediaType = 'video'
      content = (vid.caption as string) || content
      mediaMimeType = vid.mimetype as string || null
      mediaUrl = vid.base64 as string || null
    }

    if (message.audioMessage) {
      const aud = message.audioMessage as Record<string, unknown>
      mediaType = 'audio'
      mediaMimeType = aud.mimetype as string || null
      mediaUrl = aud.base64 as string || null
    }

    if (message.documentMessage) {
      const doc = message.documentMessage as Record<string, unknown>
      mediaType = 'document'
      fileName = doc.fileName as string || null
      mediaMimeType = doc.mimetype as string || null
      mediaUrl = doc.base64 as string || null
      content = (doc.caption as string) || content
    }

    if (message.stickerMessage) {
      const stk = message.stickerMessage as Record<string, unknown>
      mediaType = 'image'
      mediaMimeType = stk.mimetype as string || 'image/webp'
      mediaUrl = stk.base64 as string || null
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
      push_name: pushName || null,
      status: fromMe ? 'sent' : 'delivered',
      lead_id: leadId,
    },
    { onConflict: 'message_id' }
  )

  // Cache contact info
  if (pushName && !fromMe) {
    await supabase.from('whatsapp_contacts').upsert(
      { remote_jid: remoteJid, push_name: pushName, updated_at: new Date().toISOString() },
      { onConflict: 'remote_jid' }
    )
  }
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
  const statusMap: Record<number, string> = { 2: 'sent', 3: 'delivered', 4: 'read' }
  const newStatus = statusMap[status]
  if (!newStatus) return
  await supabase.from('whatsapp_messages').update({ status: newStatus }).eq('message_id', messageId)
}

async function handleConnectionUpdate(
  supabase: ReturnType<typeof getSupabase>,
  instanceName: string,
  data: Record<string, unknown>
) {
  const state = data.state as string | undefined
  if (!state) return
  const status = state === 'open' ? 'connected' : state === 'connecting' ? 'connecting' : 'disconnected'
  await supabase.from('whatsapp_instances').update({ status }).eq('instance_name', instanceName)
}
