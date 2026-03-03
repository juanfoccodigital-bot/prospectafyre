import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evolutionApi } from '@/lib/evolution/client'

export async function GET() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  const userId = authUser?.id

  const { data: instances } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('created_by', userId || '')
    .order('created_at', { ascending: false })

  if (!instances?.length) {
    // Check if any pf-* instance exists on Evolution API but not in Supabase
    try {
      const evoInstances = await evolutionApi.fetchInstances() as { name: string; connectionStatus: string }[]
      const pfInstance = evoInstances.find((i) => i.name.startsWith('pf-'))
      if (pfInstance) {
        // Check if this instance is already claimed by another user
        const { data: existing } = await supabase
          .from('whatsapp_instances')
          .select('created_by')
          .eq('instance_name', pfInstance.name)
          .maybeSingle()

        if (existing && existing.created_by && existing.created_by !== userId) {
          // Instance belongs to another user — don't claim it
          return NextResponse.json([])
        }

        const status = pfInstance.connectionStatus === 'open' ? 'connected' : pfInstance.connectionStatus === 'connecting' ? 'connecting' : 'disconnected'
        await supabase.from('whatsapp_instances').upsert({
          instance_name: pfInstance.name,
          status,
          created_by: userId || null,
        }, { onConflict: 'instance_name' })
        const { data: saved } = await supabase.from('whatsapp_instances').select('*').eq('instance_name', pfInstance.name).maybeSingle()
        if (saved) return NextResponse.json([{ ...saved, status }])
      }
    } catch {
      // ignore
    }
    return NextResponse.json([])
  }

  // Enrich with live connection state
  const enriched = await Promise.all(
    instances.map(async (inst) => {
      try {
        const state = await evolutionApi.getConnectionState(inst.instance_name)
        const status = state.state === 'open' ? 'connected' : state.state === 'connecting' ? 'connecting' : 'disconnected'
        if (inst.status !== status) {
          await supabase.from('whatsapp_instances').update({ status }).eq('instance_name', inst.instance_name)
        }
        return { ...inst, status }
      } catch {
        // Instance no longer exists on Evolution API — mark as disconnected
        if (inst.status !== 'disconnected') {
          await supabase.from('whatsapp_instances').update({ status: 'disconnected' }).eq('instance_name', inst.instance_name)
        }
        return { ...inst, status: 'disconnected' }
      }
    })
  )

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const { instanceName } = await req.json()
  if (!instanceName) {
    return NextResponse.json({ error: 'instanceName required' }, { status: 400 })
  }

  const webhookUrl = `${(process.env.NEXT_PUBLIC_APP_URL || '').trim()}/api/whatsapp/webhook`

  try {
    // Check if instance already exists on Evolution API
    let instanceExists = false
    try {
      const instances = await evolutionApi.fetchInstances() as { name: string }[]
      instanceExists = instances.some((i) => i.name === instanceName)
    } catch {
      // ignore
    }

    let result: unknown
    if (!instanceExists) {
      result = await evolutionApi.createInstance(instanceName, webhookUrl)
    } else {
      // Instance exists, just update webhook and get QR code
      try {
        await evolutionApi.setWebhook(instanceName, webhookUrl, [
          'QRCODE_UPDATED', 'MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE', 'SEND_MESSAGE',
        ])
      } catch {
        // ignore webhook error
      }
      result = await evolutionApi.connectInstance(instanceName)
    }

    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()

    const resultObj = result as Record<string, unknown>
    const instanceData = resultObj?.instance as Record<string, unknown> | undefined
    const instanceId = instanceData?.instanceId as string || null

    await supabase.from('whatsapp_instances').upsert({
      instance_name: instanceName,
      instance_id: instanceId,
      status: 'connecting',
      webhook_url: webhookUrl,
      created_by: user?.user?.id || null,
    }, { onConflict: 'instance_name' })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create instance'
    console.error('POST /api/whatsapp/instance error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { instanceName } = await req.json()
  if (!instanceName) {
    return NextResponse.json({ error: 'instanceName required' }, { status: 400 })
  }

  try {
    await evolutionApi.deleteInstance(instanceName)
  } catch {
    // ignore if not found
  }

  const supabase = await createClient()
  await supabase.from('whatsapp_instances').delete().eq('instance_name', instanceName)

  return NextResponse.json({ ok: true })
}
