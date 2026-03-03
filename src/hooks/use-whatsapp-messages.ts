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
        // Functional update: always preserves temp messages until server confirms them
        setMessages(prev => {
          const temps = prev.filter(m => m.id.startsWith('temp-'))
          if (!temps.length) return data

          // Keep temps that have NO matching server outbound message yet
          // Auto-expire after 30s as safety net
          const keptTemps = temps.filter(temp =>
            !data.some((d: WhatsAppMessage) => d.direction === 'outbound' && d.content === temp.content) &&
            Date.now() - new Date(temp.created_at).getTime() < 30000
          )
          if (!keptTemps.length) return data
          // Merge and sort chronologically so temps sit in the right position
          return [...data, ...keptTemps].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        })
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [remoteJid])

  const sendText = useCallback(async (instanceName: string, number: string, text: string) => {
    // Optimistic: show immediately — polling will preserve it until server confirms
    const tempId = `temp-${Date.now()}`
    setMessages(prev => [...prev, {
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

    // Fire and forget — polling handles the rest
    const res = await fetch('/api/whatsapp/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceName, number, text }),
    })
    return res.ok
  }, [])

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
