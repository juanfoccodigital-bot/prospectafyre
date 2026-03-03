'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConnectionSetup } from '@/components/whatsapp/connection-setup'
import { ConnectionStatusBadge } from '@/components/whatsapp/connection-status-badge'
import { ConversationList } from '@/components/whatsapp/conversation-list'
import { ChatPanel } from '@/components/whatsapp/chat-panel'
import { QRCodeDialog } from '@/components/whatsapp/qr-code-dialog'
import { useWhatsAppInstance } from '@/hooks/use-whatsapp-instance'
import { useConversations } from '@/hooks/use-conversations'
import { useUser } from '@/hooks/use-user'
import { phoneToJid } from '@/lib/evolution/utils'

function AtendimentoContent() {
  const searchParams = useSearchParams()
  const phoneParam = searchParams.get('phone')

  const { user } = useUser()

  const {
    instance,
    status,
    qrCode,
    loading: instanceLoading,
    creating,
    createInstance,
    refreshQRCode,
    deleteInstance,
  } = useWhatsAppInstance()

  const { conversations, loading: convsLoading, markAsRead } = useConversations()

  const [activeJid, setActiveJid] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)

  // Handle phone param from kanban
  useEffect(() => {
    if (phoneParam) {
      const jid = phoneToJid(phoneParam)
      setActiveJid(jid)
      setShowMobileChat(true)
      if (user) {
        markAsRead(jid, user.id)
      }
    }
  }, [phoneParam, user, markAsRead])

  // Auto-show QR dialog when QR code becomes available during creation
  useEffect(() => {
    if (qrCode && status === 'connecting') {
      setShowQR(true)
    }
  }, [qrCode, status])

  // Auto-close QR dialog when connected
  useEffect(() => {
    if (status === 'connected') {
      setShowQR(false)
    }
  }, [status])

  const activeConversation = conversations.find((c) => c.remote_jid === activeJid) || null

  const handleConnect = useCallback((name: string) => {
    createInstance(name)
    setShowQR(true)
  }, [createInstance])

  const handleSelectConversation = (jid: string) => {
    setActiveJid(jid)
    setShowMobileChat(true)
    // Mark conversation as read
    if (user) {
      markAsRead(jid, user.id)
    }
  }

  const handleNewChat = () => {
    const phone = prompt('Numero do contato (com DDD, ex: 11999999999):')
    if (!phone) return
    const digits = phone.replace(/\D/g, '')
    const fullPhone = digits.startsWith('55') ? digits : `55${digits}`
    const jid = phoneToJid(fullPhone)
    setActiveJid(jid)
    setShowMobileChat(true)
  }

  // Initial loading (only on first mount, not during creation)
  if (instanceLoading && !creating) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    )
  }

  // Show setup if no instance or disconnected (and not in the middle of creating)
  const showSetup = (!instance || status === 'disconnected') && !creating

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-[calc(100vh-4rem)] flex-col"
      >
        {showSetup ? (
          <ConnectionSetup
            status={status}
            qrCode={qrCode}
            loading={creating}
            userName={user?.name || user?.email?.split('@')[0] || 'usuario'}
            onConnect={handleConnect}
            onRefreshQR={refreshQRCode}
          />
        ) : (
          <>
            {/* Status bar */}
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-2">
              <div className="flex items-center gap-3">
                <h1 className="text-sm font-semibold">Atendimento WhatsApp</h1>
                <ConnectionStatusBadge />
              </div>
              <div className="flex items-center gap-2">
                {status === 'connecting' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => setShowQR(true)}
                  >
                    <Wifi className="h-3 w-3" />
                    Ver QR Code
                  </Button>
                )}
                {status === 'connected' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1.5 text-xs text-muted-foreground"
                    onClick={deleteInstance}
                  >
                    <WifiOff className="h-3 w-3" />
                    Desconectar
                  </Button>
                )}
              </div>
            </div>

            {/* Chat layout */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className={`w-full flex-shrink-0 overflow-hidden lg:w-80 ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
                <ConversationList
                  conversations={conversations}
                  loading={convsLoading}
                  activeJid={activeJid}
                  onSelect={handleSelectConversation}
                  onNewChat={handleNewChat}
                />
              </div>

              <div className={`min-w-0 flex-1 ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
                <div className="flex-1">
                  <ChatPanel
                    remoteJid={activeJid}
                    instanceName={instance?.instance_name || ''}
                    conversation={activeConversation}
                    onBack={() => setShowMobileChat(false)}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* QR Code dialog — always rendered outside conditional branches */}
      <QRCodeDialog
        open={showQR}
        onOpenChange={setShowQR}
        qrCode={qrCode}
        status={status}
        onRefreshQR={refreshQRCode}
      />
    </>
  )
}

export default function AtendimentoPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    }>
      <AtendimentoContent />
    </Suspense>
  )
}
