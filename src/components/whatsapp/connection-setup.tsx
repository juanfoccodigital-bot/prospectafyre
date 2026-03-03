'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Wifi, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ConnectionSetupProps {
  status: 'disconnected' | 'connecting' | 'connected'
  qrCode: string | null
  loading: boolean
  userName: string
  onConnect: (name: string) => void
  onRefreshQR: () => void
}

function buildInstanceName(userName: string) {
  return `pf-${userName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30)}`
}

export function ConnectionSetup({
  loading,
  userName,
  onConnect,
}: ConnectionSetupProps) {
  const handleConnect = () => {
    const instanceName = buildInstanceName(userName)
    onConnect(instanceName)
  }

  return (
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
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
            {loading ? 'Conectando...' : 'Conectar WhatsApp'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
