'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Calendar, ExternalLink, MapPin, Phone, Briefcase, User, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { ContactTags } from './contact-tags'
import { TemplatePicker } from './template-picker'
import { TemplateManager } from './template-manager'
import { MeetingModal } from '@/components/meetings/meeting-modal'
import { ConvertToLeadModal } from '@/components/contacts/convert-to-lead-modal'
import { useWhatsAppMessages } from '@/hooks/use-whatsapp-messages'
import { useUser } from '@/hooks/use-user'
import { useWhatsAppTemplates } from '@/hooks/use-whatsapp-templates'
import { phoneToDisplay, jidToPhone } from '@/lib/evolution/utils'
import type { Conversation, Lead, WhatsAppContact } from '@/types'
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
  const [showProfile, setShowProfile] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [inputText, setInputText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user } = useUser()

  const phone = remoteJid ? jidToPhone(remoteJid) : ''
  const displayPhone = phone ? phoneToDisplay(phone) : ''
  const lead = conversation?.lead as Lead | null | undefined
  const contactName = conversation?.contact_name || lead?.nome || displayPhone
  const profilePic = conversation?.profile_pic_url

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

        <button onClick={() => setShowProfile(true)} className="shrink-0">
          {profilePic ? (
            <img src={profilePic} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              {contactName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        <button onClick={() => setShowProfile(true)} className="min-w-0 flex-1 text-left">
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
        </button>

        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          title="Agendar Reunião"
          onClick={() => setShowMeetingModal(true)}
        >
          <Calendar className="h-4 w-4" />
        </Button>
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

      {/* Contact profile sheet */}
      <Sheet open={showProfile} onOpenChange={setShowProfile}>
        <SheetContent className="border-border/50 bg-card w-80">
          <SheetHeader>
            <SheetTitle>Perfil do contato</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col items-center gap-4">
            {profilePic ? (
              <img src={profilePic} alt="" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-3xl font-bold text-primary">
                {contactName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-center">
              <p className="text-lg font-semibold">{contactName}</p>
              <p className="text-sm text-muted-foreground">{displayPhone}</p>
            </div>
          </div>

          {lead && (
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Lead vinculado</h4>
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{lead.nome}</p>
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
                </div>
                {lead.especialidade && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    {lead.especialidade}
                  </div>
                )}
                {(lead.cidade || lead.estado) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {[lead.cidade, lead.estado].filter(Boolean).join(' - ')}
                  </div>
                )}
                {lead.telefone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    ({lead.ddd}) {lead.telefone}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full gap-1.5 text-xs"
                  onClick={() => {
                    setShowProfile(false)
                    window.open(`/kanban?lead=${lead.id}`, '_self')
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver no Kanban
                </Button>
              </div>
            </div>
          )}

          {!lead && (
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Lead</h4>
              <div className="rounded-lg border border-border/50 p-4 text-center space-y-3">
                <p className="text-xs text-muted-foreground">
                  Nenhum lead vinculado a este contato
                </p>
                <Button
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  onClick={() => {
                    setShowProfile(false)
                    setShowConvertModal(true)
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Converter em Lead
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Meeting modal */}
      {user && (
        <MeetingModal
          open={showMeetingModal}
          onClose={() => setShowMeetingModal(false)}
          onSave={() => setShowMeetingModal(false)}
          defaultLeadId={lead?.id || null}
          defaultContactJid={remoteJid}
          userId={user.id}
        />
      )}

      {/* Convert to lead modal */}
      <ConvertToLeadModal
        contact={remoteJid ? {
          remote_jid: remoteJid,
          push_name: conversation?.contact_name || null,
          nome: conversation?.contact_name || null,
          profile_pic_url: profilePic || null,
          observacoes: null,
          created_manually: false,
          updated_at: new Date().toISOString(),
        } as WhatsAppContact : null}
        open={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        onConverted={() => {
          setShowConvertModal(false)
          window.location.reload()
        }}
      />
    </div>
  )
}
