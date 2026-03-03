'use client'

import { useEffect, useState, useCallback } from 'react'

interface ConnectionStatusBadgeProps {
  compact?: boolean
}

export function ConnectionStatusBadge({ compact }: ConnectionStatusBadgeProps) {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/instance')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setStatus(data[0].status || 'disconnected')
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const colors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
  }

  const labels = {
    connected: 'Conectado',
    connecting: 'Conectando...',
    disconnected: 'Desconectado',
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" title={`WhatsApp ${labels[status]}`}>
        <div className={`h-2 w-2 rounded-full ${colors[status]}`} />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/80 px-3 py-1.5">
      <div className={`h-2 w-2 rounded-full ${colors[status]} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-muted-foreground">WhatsApp</span>
      <span className={`text-xs font-medium ${status === 'connected' ? 'text-green-500' : status === 'connecting' ? 'text-yellow-500' : 'text-red-500'}`}>
        {labels[status]}
      </span>
    </div>
  )
}
