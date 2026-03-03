'use client'

import { useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  qrCode: string | null
  status: 'disconnected' | 'connecting' | 'connected'
  onRefreshQR: () => void
}

export function QRCodeDialog({
  open,
  onOpenChange,
  qrCode,
  status,
  onRefreshQR,
}: QRCodeDialogProps) {
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch QR immediately when dialog opens, then auto-refresh every 30s
  useEffect(() => {
    if (open && status === 'connecting') {
      onRefreshQR()
      refreshRef.current = setInterval(onRefreshQR, 30000)
    }
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current)
    }
  }, [open, status, onRefreshQR])

  // Auto-close when connected
  useEffect(() => {
    if (status === 'connected') {
      onOpenChange(false)
    }
  }, [status, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/50 bg-card sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {status === 'connecting' && qrCode ? (
            <>
              <div className="rounded-xl bg-white p-3">
                <img
                  src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code WhatsApp"
                  className="h-56 w-56"
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Abra o WhatsApp no seu celular, toque em <strong>Aparelhos Conectados</strong> e escaneie o QR Code acima.
              </p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                <span className="text-xs text-yellow-500">Aguardando leitura...</span>
              </div>
            </>
          ) : status === 'connected' ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-green-500">WhatsApp Conectado!</p>
            </div>
          ) : (
            <Skeleton className="h-56 w-56" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
