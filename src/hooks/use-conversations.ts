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

  return { conversations, loading, refetch: fetchConversations }
}
