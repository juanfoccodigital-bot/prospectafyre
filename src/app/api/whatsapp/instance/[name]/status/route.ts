import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evolutionApi } from '@/lib/evolution/client'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  try {
    const state = await evolutionApi.getConnectionState(name)
    const status = state.state === 'open' ? 'connected' : state.state === 'connecting' ? 'connecting' : 'disconnected'

    // Update Supabase
    const supabase = await createClient()
    await supabase
      .from('whatsapp_instances')
      .update({ status })
      .eq('instance_name', name)

    return NextResponse.json({ status })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to get status' },
      { status: 500 }
    )
  }
}
