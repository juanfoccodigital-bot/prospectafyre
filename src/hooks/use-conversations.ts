'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Conversation } from '@/types'

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/messages/conversations')
      const data = await res.json()
      if (Array.isArray(data)) {
        setConversations(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    pollRef.current = setInterval(fetchConversations, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchConversations])

  const markAsRead = useCallback(async (remoteJid: string, userId: string) => {
    try {
      await fetch('/api/whatsapp/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteJid, userId }),
      })
      // Optimistically update local state
      setConversations((prev) =>
        prev.map((c) =>
          c.remote_jid === remoteJid ? { ...c, unread_count: 0 } : c
        )
      )
    } catch {
      // ignore
    }
  }, [])

  return { conversations, loading, refetch: fetchConversations, markAsRead }
}
