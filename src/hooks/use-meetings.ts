'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Meeting } from '@/types'

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch('/api/meetings')
      const data = await res.json()
      if (Array.isArray(data)) {
        setMeetings(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  const createMeeting = useCallback(async (data: {
    titulo: string
    scheduled_at: string
    duration_min?: number
    descricao?: string
    lead_id?: string | null
    contact_jid?: string | null
    created_by: string
  }) => {
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      await fetchMeetings()
    }
    return res.ok
  }, [fetchMeetings])

  const updateMeeting = useCallback(async (id: string, data: Partial<Meeting>) => {
    const res = await fetch('/api/meetings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })
    if (res.ok) {
      await fetchMeetings()
    }
    return res.ok
  }, [fetchMeetings])

  const deleteMeeting = useCallback(async (id: string) => {
    const res = await fetch('/api/meetings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      await fetchMeetings()
    }
    return res.ok
  }, [fetchMeetings])

  return { meetings, loading, refetch: fetchMeetings, createMeeting, updateMeeting, deleteMeeting }
}

export function useUpcomingMeetings(limit = 5) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUpcoming = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings?upcoming=true&limit=${limit}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setMeetings(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchUpcoming()
  }, [fetchUpcoming])

  return { meetings, loading, refetch: fetchUpcoming }
}
