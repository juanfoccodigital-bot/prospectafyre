import { NextResponse } from 'next/server'
import { handleWebhook } from '../route'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ event: string[] }> }
) {
  const { event } = await params
  const eventSegment = event?.[0] || ''

  const body = await req.json()
  await handleWebhook(body, eventSegment)

  return NextResponse.json({ ok: true })
}
