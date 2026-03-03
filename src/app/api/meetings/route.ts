import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const upcoming = searchParams.get('upcoming') === 'true'
  const leadId = searchParams.get('lead_id')
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  const supabase = await createClient()

  let query = supabase
    .from('meetings')
    .select('*, lead:leads!lead_id(id, nome, status), creator:users!created_by(id, name, avatar_url)')
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (upcoming) {
    query = query
      .eq('status', 'agendada')
      .gte('scheduled_at', new Date().toISOString())
  }

  if (leadId) {
    query = query.eq('lead_id', leadId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const body = await req.json()
  const { titulo, scheduled_at, duration_min, descricao, lead_id, contact_jid, created_by } = body

  if (!titulo || !scheduled_at || !created_by) {
    return NextResponse.json({ error: 'titulo, scheduled_at, and created_by are required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase.from('meetings').insert({
    titulo,
    scheduled_at,
    duration_min: duration_min || 30,
    descricao: descricao || null,
    lead_id: lead_id || null,
    contact_jid: contact_jid || null,
    created_by,
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('meetings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const body = await req.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase.from('meetings').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
