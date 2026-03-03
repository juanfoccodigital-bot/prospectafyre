'use client'

import { useCallback, useEffect, useState } from 'react'
import type { WhatsAppContact } from '@/types'

export function useContacts() {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/contacts')
      const data = await res.json()
      if (Array.isArray(data)) {
        setContacts(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const createContact = useCallback(async (phone: string, nome?: string) => {
    const res = await fetch('/api/whatsapp/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, nome }),
    })
    if (res.ok) {
      await fetchContacts()
    }
    return res.ok
  }, [fetchContacts])

  const updateContact = useCallback(async (remoteJid: string, data: { nome?: string; observacoes?: string }) => {
    const res = await fetch('/api/whatsapp/contacts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remoteJid, ...data }),
    })
    if (res.ok) {
      await fetchContacts()
    }
    return res.ok
  }, [fetchContacts])

  const deleteContact = useCallback(async (remoteJid: string) => {
    const res = await fetch('/api/whatsapp/contacts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remoteJid }),
    })
    if (res.ok) {
      await fetchContacts()
    }
    return res.ok
  }, [fetchContacts])

  const archiveContact = useCallback(async (remoteJid: string, archived: boolean) => {
    const res = await fetch('/api/whatsapp/contacts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remoteJid, archived }),
    })
    if (res.ok) {
      await fetchContacts()
    }
    return res.ok
  }, [fetchContacts])

  return { contacts, loading, refetch: fetchContacts, createContact, updateContact, deleteContact, archiveContact }
}
