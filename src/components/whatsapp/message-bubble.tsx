'use client'

import { Check, CheckCheck, FileText, Play } from 'lucide-react'
import type { WhatsAppMessage } from '@/types'

interface MessageBubbleProps {
  message: WhatsAppMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'
  const time = new Date(message.created_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
          isOutbound
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md bg-card border border-border/50'
        }`}
      >
        {/* Media preview */}
        {message.media_type === 'image' && message.media_url && (
          <div className="mb-1.5">
            <img
              src={message.media_url.startsWith('data:') ? message.media_url : `data:image/jpeg;base64,${message.media_url}`}
              alt="Imagem"
              className="max-h-48 rounded-lg object-cover"
            />
          </div>
        )}

        {message.media_type === 'video' && (
          <div className="mb-1.5 flex h-32 items-center justify-center rounded-lg bg-black/20">
            <Play className="h-8 w-8 text-white/70" />
          </div>
        )}

        {message.media_type === 'audio' && (
          <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2">
            <Play className="h-4 w-4 shrink-0" />
            <div className="h-1 flex-1 rounded-full bg-current opacity-30" />
            <span className="text-[10px] opacity-60">Audio</span>
          </div>
        )}

        {message.media_type === 'document' && (
          <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate text-xs">{message.file_name || 'Documento'}</span>
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
        )}

        {/* Time and status */}
        <div className={`mt-1 flex items-center justify-end gap-1 ${isOutbound ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
          <span className="text-[10px]">{time}</span>
          {isOutbound && (
            <StatusIcon status={message.status} />
          )}
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'read') return <CheckCheck className="h-3 w-3 text-blue-300" />
  if (status === 'delivered') return <CheckCheck className="h-3 w-3" />
  return <Check className="h-3 w-3" />
}
