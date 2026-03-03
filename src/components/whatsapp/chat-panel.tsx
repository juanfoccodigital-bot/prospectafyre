'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { ContactTags } from './contact-tags'
import { TemplatePicker } from './template-picker'
import { TemplateManager } from './template-manager'
import { useWhatsAppMessages } from '@/hooks/use-whatsapp-messages'
import { useWhatsAppTemplates } from '@/hooks/use-whatsapp-templates'
import { phoneToDisplay, jidToPhone } from '@/lib/evolution/utils'
import type { Conversation, Lead } from '@/types'
import { LEAD_STATUS_CONFIG } from '@/types'

interface ChatPanelProps {
  remoteJid: string | null
  instanceName: string
  conversation?: Conversation | null
  onBack?: () => void
}

export function ChatPanel({ remoteJid, instanceName, conversation, onBack }: ChatPanelProps) {
  const { messages, loading, sendText, sendMedia } = useWhatsAppMessages(remoteJid)
  const { templates, createTemplate, deleteTemplate } = useWhatsAppTemplates()
  const [showTemplates, setShowTemplates] = useState(false)
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [inputText, setInputText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const phone = remoteJid ? jidToPhone(remoteJid) : ''
  const displayPhone = phone ? phoneToDisplay(phone) : ''
  const lead = conversation?.lead as Lead | null | undefined
  const contactName = lead?.nome || displayPhone

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendText = (text: string) => {
    if (!remoteJid) return
    sendText(instanceName, phone, text)
  }

  const handleSendMedia = (mediatype: string, media: string, caption?: string, fileName?: string) => {
    if (!remoteJid) return
    sendMedia(instanceName, phone, mediatype, media, caption, fileName)
  }

  const handleTemplateSelect = (content: string) => {
    setInputText(content)
  }

  if (!remoteJid) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Selecione uma conversa ou inicie uma nova
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
        {onBack && (
          <Button size="icon" variant="ghost" className="h-8 w-8 lg:hidden" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
          {contactName.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{contactName}</p>
            {lead && (
              <Badge
                variant="outline"
                className="text-[9px]"
                style={{
                  borderColor: `${LEAD_STATUS_CONFIG[lead.status]?.color}40`,
                  color: LEAD_STATUS_CONFIG[lead.status]?.color,
                }}
              >
                {LEAD_STATUS_CONFIG[lead.status]?.label}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">{displayPhone}</p>
        </div>

        <ContactTags remoteJid={remoteJid} />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className={`h-10 ${i % 2 ? 'w-48' : 'w-56'} rounded-2xl`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSendText={(text) => {
          handleSendText(inputText || text)
          setInputText('')
        }}
        onSendMedia={handleSendMedia}
        onOpenTemplates={() => setShowTemplates(true)}
        disabled={!instanceName}
      />

      {/* Template picker & manager */}
      <TemplatePicker
        open={showTemplates}
        onOpenChange={setShowTemplates}
        templates={templates}
        onSelect={handleTemplateSelect}
        onManage={() => {
          setShowTemplates(false)
          setShowTemplateManager(true)
        }}
        lead={lead}
        trigger={<span />}
      />
      <TemplateManager
        open={showTemplateManager}
        onOpenChange={setShowTemplateManager}
        templates={templates}
        onCreate={createTemplate}
        onDelete={deleteTemplate}
      />
    </div>
  )
}
