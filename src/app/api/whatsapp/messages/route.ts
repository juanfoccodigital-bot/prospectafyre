import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evolutionApi } from '@/lib/evolution/client'
import { jidToPhone } from '@/lib/evolution/utils'
import { getUserInstance } from '@/lib/supabase/get-user-instance'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const remoteJid = searchParams.get('remoteJid')
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  if (!remoteJid) {
    return NextResponse.json({ error: 'remoteJid required' }, { status: 400 })
  }

  const supabase = await createClient()
  const instanceName = await getUserInstance(supabase)

  let query = supabase
    .from('whatsapp_messages')
    .select('*, lead:leads!lead_id(id, nome, especialidade, status, ddd, telefone)')
    .eq('remote_jid', remoteJid)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (instanceName) {
    query = query.or(`instance_name.eq.${instanceName},instance_name.is.null`)
  }

  console.log('[GET /messages]', { remoteJid, instanceName, limit })

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const body = await req.json()
  const { instanceName, number, text, mediatype, media, caption, fileName } = body

  if (!instanceName || !number) {
    return NextResponse.json({ error: 'instanceName and number required' }, { status: 400 })
  }

  try {
    let result: unknown
    const remoteJid = `${number.replace(/\D/g, '')}@s.whatsapp.net`

    // Extract mime type and strip data: URI prefix for Evolution API
    let mediaMimeType: string | null = null
    if (media) {
      const mimeMatch = media.match(/^data:([^;]+);base64,/)
      if (mimeMatch) mediaMimeType = mimeMatch[1]
    }
    const rawMedia = media ? media.replace(/^data:[^;]+;base64,/, '') : media

    if (mediatype === 'audio') {
      result = await evolutionApi.sendAudio(instanceName, number, rawMedia)
    } else if (mediatype && media) {
      result = await evolutionApi.sendMedia(instanceName, {
        number,
        mediatype,
        media: rawMedia,
        caption,
        fileName,
      })
    } else if (text) {
      result = await evolutionApi.sendText(instanceName, number, text)
    } else {
      return NextResponse.json({ error: 'text or media required' }, { status: 400 })
    }

    // Save to database
    const supabase = await createClient()

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
        const match = leads.find((l) => {
          const lp = ((l.ddd || '') + (l.telefone || '')).replace(/\D/g, '')
          return lp && phoneDigits.endsWith(lp)
        })
        if (match) leadId = match.id
      }
    }

    const resultObj = result as Record<string, unknown>
    const messageId = (resultObj?.key as Record<string, unknown>)?.id as string || null

    const { error: insertError } = await supabase.from('whatsapp_messages').insert({
      instance_name: instanceName,
      remote_jid: remoteJid,
      message_id: messageId,
      direction: 'outbound',
      content: text || caption || null,
      media_type: mediatype || null,
      media_url: media || null,
      media_mime_type: mediaMimeType,
      file_name: fileName || null,
      status: 'sent',
      lead_id: leadId,
    })

    if (insertError) {
      console.error('[POST /messages] insert error:', insertError.message, { instanceName, remoteJid, messageId })
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, messageId })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}
