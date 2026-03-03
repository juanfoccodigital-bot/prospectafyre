'use client'

import { Badge } from '@/components/ui/badge'
import type { Conversation } from '@/types'

interface ConversationItemProps {
  conversation: Conversation
  active: boolean
  onClick: () => void
}

export function ConversationItem({ conversation, active, onClick }: ConversationItemProps) {
  const name = conversation.lead?.nome || conversation.phone
  const initial = name.charAt(0).toUpperCase()

  const timeAgo = formatTimeAgo(conversation.last_message_at)

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
        active
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-muted/50 border border-transparent'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium">{name}</p>
          <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {conversation.last_message || 'Sem mensagens'}
        </p>
        {conversation.tags.length > 0 && (
          <div className="mt-1 flex gap-1">
            {conversation.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

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
