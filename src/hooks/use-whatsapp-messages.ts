'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WhatsAppMessage } from '@/types'

export function useWhatsAppMessages(remoteJid: string | null) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!remoteJid) {
      setMessages([])
      return
    }
    try {
      const res = await fetch(`/api/whatsapp/messages?remoteJid=${encodeURIComponent(remoteJid)}&limit=100`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setMessages(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [remoteJid])

  const sendText = useCallback(async (instanceName: string, number: string, text: string) => {
    // Optimistic: show message immediately
    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [...prev, {
      id: tempId,
      instance_name: instanceName,
      remote_jid: `${number.replace(/\D/g, '')}@s.whatsapp.net`,
      message_id: tempId,
      direction: 'outbound' as const,
      content: text,
      media_type: null,
      media_url: null,
      media_mime_type: null,
      file_name: null,
      status: 'sent' as const,
      lead_id: null,
      created_at: new Date().toISOString(),
    }])

    const res = await fetch('/api/whatsapp/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName, number, text }),
    })
    await fetchMessages()
    return res.ok
  }, [fetchMessages])

  const sendMedia = useCallback(async (
    instanceName: string,
    number: string,
    mediatype: string,
    media: string,
    caption?: string,
    fileName?: string
  ) => {
    const res = await fetch('/api/whatsapp/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName, number, mediatype, media, caption, fileName }),
    })
    if (res.ok) {
      await fetchMessages()
    }
    return res.ok
  }, [fetchMessages])

  // Poll for new messages
  useEffect(() => {
    if (remoteJid) {
      setLoading(true)
      fetchMessages()
      pollRef.current = setInterval(fetchMessages, 3000)
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [remoteJid, fetchMessages])

  return { messages, loading, sendText, sendMedia, refetch: fetchMessages }
}
