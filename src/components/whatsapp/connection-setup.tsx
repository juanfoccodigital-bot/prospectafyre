'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QRCodeDialog } from './qr-code-dialog'

interface ConnectionSetupProps {
  status: 'disconnected' | 'connecting' | 'connected'
  qrCode: string | null
  loading: boolean
  onConnect: (name: string) => void
  onRefreshQR: () => void
}

const INSTANCE_NAME = 'prospectafyre-main'

export function ConnectionSetup({
  status,
  qrCode,
  loading,
  onConnect,
  onRefreshQR,
}: ConnectionSetupProps) {
  const [showQR, setShowQR] = useState(false)

  const handleConnect = () => {
    onConnect(INSTANCE_NAME)
    setShowQR(true)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-full items-center justify-center"
      >
        <Card className="w-full max-w-md border-border/50 bg-card/80">
          <CardContent className="flex flex-col items-center py-12">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500/10">
              <MessageSquare className="h-10 w-10 text-green-500" />
            </div>

            <h2 className="mb-2 text-xl font-bold">Conectar WhatsApp</h2>
            <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
              Conecte seu WhatsApp para enviar e receber mensagens diretamente pelo ProspectaFyre.
            </p>

            <Button
              onClick={handleConnect}
              disabled={loading}
              className="gap-2 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Wifi className="h-4 w-4" />
              {loading ? 'Conectando...' : 'Conectar WhatsApp'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <QRCodeDialog
        open={showQR}
        onOpenChange={setShowQR}
        qrCode={qrCode}
        status={status}
        onRefreshQR={onRefreshQR}
      />
    </>
  )
}
