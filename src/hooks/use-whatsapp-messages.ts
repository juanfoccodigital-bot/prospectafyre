'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WhatsAppMessage } from '@/types'

export function useWhatsAppMessages(remoteJid: string | null) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Temp messages that haven't been persisted yet — always merged into state
  const pendingRef = useRef<WhatsAppMessage[]>([])

  const fetchMessages = useCallback(async () => {
    if (!remoteJid) {
      setMessages([])
      return
    }
    try {
      const res = await fetch(`/api/whatsapp/messages?remoteJid=${encodeURIComponent(remoteJid)}&limit=100`)
      const data = await res.json()
      if (Array.isArray(data)) {
        // Always merge: server data + any pending optimistic messages
        const pending = pendingRef.current
        if (pending.length) {
          setMessages([...data, ...pending])
        } else {
          setMessages(data)
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [remoteJid])

  const sendText = useCallback(async (instanceName: string, number: string, text: string) => {
    const tempId = `temp-${Date.now()}`
    const optimistic: WhatsAppMessage = {
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
    }

    // Add to pending and show immediately
    pendingRef.current = [...pendingRef.current, optimistic]
    setMessages((prev) => [...prev, optimistic])

    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName, number, text }),
      })
      // Message saved to DB — remove from pending, refetch gets the real one
      pendingRef.current = pendingRef.current.filter((m) => m.id !== tempId)
      await fetchMessages()
      return res.ok
    } catch {
      pendingRef.current = pendingRef.current.filter((m) => m.id !== tempId)
      await fetchMessages()
      return false
    }
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
