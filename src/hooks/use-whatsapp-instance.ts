'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WhatsAppInstance } from '@/types'

export function useWhatsAppInstance() {
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null)
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchInstance = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/instance')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const inst = data[0] as WhatsAppInstance
        setInstance(inst)
        setStatus(inst.status)
        return inst
      }
      setInstance(null)
      setStatus('disconnected')
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
    return null
  }, [])

  const createInstance = useCallback(async (name: string) => {
    setLoading(true)
    try {
      await fetch('/api/whatsapp/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: name }),
      })
      setStatus('connecting')
      // Fetch QR code
      const qrRes = await fetch(`/api/whatsapp/instance/${name}/qrcode`)
      const qrData = await qrRes.json()
      if (qrData.base64) {
        setQrCode(qrData.base64)
      }
      await fetchInstance()
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [fetchInstance])

  const refreshQRCode = useCallback(async () => {
    if (!instance) return
    try {
      const res = await fetch(`/api/whatsapp/instance/${instance.instance_name}/qrcode`)
      const data = await res.json()
      if (data.base64) {
        setQrCode(data.base64)
      }
    } catch {
      // ignore
    }
  }, [instance])

  const refreshStatus = useCallback(async () => {
    if (!instance) return
    try {
      const res = await fetch(`/api/whatsapp/instance/${instance.instance_name}/status`)
      const data = await res.json()
      if (data.status) {
        setStatus(data.status)
        if (data.status === 'connected') {
          setQrCode(null)
        }
      }
    } catch {
      // ignore
    }
  }, [instance])

  const deleteInstance = useCallback(async () => {
    if (!instance) return
    try {
      await fetch(`/api/whatsapp/instance`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: instance.instance_name }),
      })
      setInstance(null)
      setStatus('disconnected')
      setQrCode(null)
    } catch {
      // ignore
    }
  }, [instance])

  // Poll status while connecting
  useEffect(() => {
    if (status === 'connecting') {
      pollRef.current = setInterval(() => {
        refreshStatus()
      }, 5000)
    } else if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [status, refreshStatus])

  // Initial fetch
  useEffect(() => {
    fetchInstance()
  }, [fetchInstance])

  return {
    instance,
    status,
    qrCode,
    loading,
    createInstance,
    refreshQRCode,
    refreshStatus,
    deleteInstance,
    refetch: fetchInstance,
  }
}
