'use client'

import { Badge } from '@/components/ui/badge'
import type { Conversation } from '@/types'

interface ConversationItemProps {
  conversation: Conversation
  active: boolean
  onClick: () => void
}

export function ConversationItem({ conversation, active, onClick }: ConversationItemProps) {
  const name = conversation.contact_name || conversation.lead?.nome || conversation.phone
  const initial = name.charAt(0).toUpperCase()
  const timeAgo = formatTimeAgo(conversation.last_message_at)

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
        active
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-muted/50 border border-transparent'
      }`}
    >
      {/* Avatar */}
      {conversation.profile_pic_url ? (
        <img
          src={conversation.profile_pic_url}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
          {initial}
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{name}</p>
          <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
        {conversation.contact_name && (
          <p className="truncate text-[11px] text-muted-foreground">{conversation.phone}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {conversation.last_message || 'Sem mensagens'}
        </p>
      </div>

      {/* Unread badge */}
      {conversation.unread_count > 0 && (
        <Badge className="h-5 min-w-5 justify-center bg-green-600 px-1.5 text-[10px]">
          {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
        </Badge>
      )}
    </button>
  )
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
