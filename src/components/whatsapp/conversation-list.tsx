'use client'

import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { ConversationItem } from './conversation-item'
import type { Conversation } from '@/types'

interface ConversationListProps {
  conversations: Conversation[]
  loading: boolean
  activeJid: string | null
  onSelect: (jid: string) => void
  onNewChat: () => void
}

export function ConversationList({
  conversations,
  loading,
  activeJid,
  onSelect,
  onNewChat,
}: ConversationListProps) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? conversations.filter((c) => {
        const name = c.lead?.nome?.toLowerCase() || ''
        const phone = c.phone.toLowerCase()
        const q = search.toLowerCase()
        return name.includes(q) || phone.includes(q)
      })
    : conversations

  return (
    <div className="flex h-full flex-col border-r border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h3 className="text-sm font-semibold">Conversas</h3>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onNewChat} title="Nova conversa">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 px-2 pb-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
          ) : (
            filtered.map((conv) => (
              <ConversationItem
                key={conv.remote_jid}
                conversation={conv}
                active={conv.remote_jid === activeJid}
                onClick={() => onSelect(conv.remote_jid)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
