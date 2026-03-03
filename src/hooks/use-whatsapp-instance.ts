'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WhatsAppInstance } from '@/types'

export function useWhatsAppInstance() {
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null)
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const instanceNameRef = useRef<string | null>(null)

  const fetchInstance = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/instance')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const inst = data[0] as WhatsAppInstance
        setInstance(inst)
        setStatus(inst.status)
        instanceNameRef.current = inst.instance_name
        // Auto-fetch QR code when instance is in connecting state
        if (inst.status === 'connecting') {
          try {
            const qrRes = await fetch(`/api/whatsapp/instance/${inst.instance_name}/qrcode`)
            const qrData = await qrRes.json()
            if (qrData.base64) {
              setQrCode(qrData.base64)
            }
          } catch {
            // QR not available yet
          }
        }
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
    setCreating(true)
    instanceNameRef.current = name
    try {
      const postRes = await fetch('/api/whatsapp/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: name }),
      })
      const postData = await postRes.json()

      // Extract QR from creation response (Evolution returns it with qrcode: true)
      const qrFromCreate = postData?.qrcode?.base64 || postData?.base64
      if (qrFromCreate) {
        setQrCode(qrFromCreate)
        setStatus('connecting')
        setCreating(false)
        // Fetch instance data in background
        fetchInstance()
        return
      }

      // Fallback: fetch QR separately
      setStatus('connecting')
      const qrRes = await fetch(`/api/whatsapp/instance/${name}/qrcode`)
      const qrData = await qrRes.json()
      if (qrData.base64) {
        setQrCode(qrData.base64)
      }
      await fetchInstance()
    } catch (err) {
      console.error('createInstance error:', err)
    } finally {
      setCreating(false)
    }
  }, [fetchInstance])

  const refreshQRCode = useCallback(async () => {
    const name = instance?.instance_name || instanceNameRef.current
    if (!name) return
    try {
      const res = await fetch(`/api/whatsapp/instance/${name}/qrcode`)
      const data = await res.json()
      if (data.base64) {
        setQrCode(data.base64)
      }
    } catch {
      // ignore
    }
  }, [instance])

  const refreshStatus = useCallback(async () => {
    const name = instance?.instance_name || instanceNameRef.current
    if (!name) return
    try {
      const res = await fetch(`/api/whatsapp/instance/${name}/status`)
      const data = await res.json()
      if (data.status) {
        setStatus(data.status)
        if (data.status === 'connected') {
          setQrCode(null)
          // Refetch instance to get full data
          if (!instance) fetchInstance()
        }
      }
    } catch {
      // ignore
    }
  }, [instance, fetchInstance])

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
      instanceNameRef.current = null
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
    creating,
    createInstance,
    refreshQRCode,
    refreshStatus,
    deleteInstance,
    refetch: fetchInstance,
  }
}
