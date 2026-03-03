import { NextResponse } from 'next/server'
import { evolutionApi } from '@/lib/evolution/client'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  try {
    const result = await evolutionApi.connectInstance(name)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to get QR code' },
      { status: 500 }
    )
  }
}
