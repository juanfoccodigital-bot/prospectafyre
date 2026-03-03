import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const { name, content, category } = await req.json()
  if (!name || !content) {
    return NextResponse.json({ error: 'name and content required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('whatsapp_templates')
    .insert({ name, content, category: category || 'geral', created_by: user?.user?.id || null })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
