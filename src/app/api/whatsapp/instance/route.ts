import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evolutionApi } from '@/lib/evolution/client'

export async function GET() {
  const supabase = await createClient()
  const { data: instances } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .order('created_at', { ascending: false })

  if (!instances?.length) {
    return NextResponse.json([])
  }

  // Enrich with live connection state
  const enriched = await Promise.all(
    instances.map(async (inst) => {
      try {
        const state = await evolutionApi.getConnectionState(inst.instance_name)
        return { ...inst, status: state.state === 'open' ? 'connected' : state.state === 'connecting' ? 'connecting' : 'disconnected' }
      } catch {
        return inst
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

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/whatsapp/webhook`

  try {
    const result = await evolutionApi.createInstance(instanceName, webhookUrl)

    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()

    await supabase.from('whatsapp_instances').upsert({
      instance_name: instanceName,
      instance_id: (result as Record<string, unknown>)?.instanceId || null,
      status: 'connecting',
      webhook_url: webhookUrl,
      created_by: user?.user?.id || null,
    }, { onConflict: 'instance_name' })

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create instance' },
      { status: 500 }
    )
  }
}
