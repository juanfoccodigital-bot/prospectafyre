'use client'

import { useCallback, useEffect, useState } from 'react'
import type { WhatsAppTemplate } from '@/types'

export function useWhatsAppTemplates() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/templates')
      const data = await res.json()
      if (Array.isArray(data)) {
        setTemplates(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const createTemplate = useCallback(async (name: string, content: string, category?: string) => {
    const res = await fetch('/api/whatsapp/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content, category }),
    })
    if (res.ok) {
      await fetchTemplates()
    }
    return res.ok
  }, [fetchTemplates])

  const deleteTemplate = useCallback(async (id: string) => {
    const res = await fetch(`/api/whatsapp/templates?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      await fetchTemplates()
    }
    return res.ok
  }, [fetchTemplates])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return { templates, loading, createTemplate, deleteTemplate, refetch: fetchTemplates }
}
