'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { KanbanCard } from './kanban-card'
import { LEAD_STATUS_CONFIG, type Lead, type LeadStatus } from '@/types'

interface KanbanColumnProps {
  status: LeadStatus
  leads: Lead[]
  onCardClick?: (lead: Lead) => void
}

export function KanbanColumn({ status, leads, onCardClick }: KanbanColumnProps) {
  const config = LEAD_STATUS_CONFIG[status]
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex h-[420px] w-64 shrink-0 flex-col rounded-2xl border bg-card/50 transition-all duration-200 ${
        isOver ? 'border-primary/50 bg-primary/5' : 'border-border/50'
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{config.emoji}</span>
          <h3 className="text-xs font-semibold">{config.label}</h3>
        </div>
        <Badge
          variant="outline"
          className="h-5 min-w-5 justify-center px-1.5 text-[10px]"
          style={{
            borderColor: `${config.color}40`,
            color: config.color,
          }}
        >
          {leads.length}
        </Badge>
      </div>

      {/* Cards - scrollable area */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-2 pb-2"
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5" style={{ minHeight: 60 }}>
            {leads.map((lead) => (
              <KanbanCard key={lead.id} lead={lead} onCardClick={onCardClick} />
            ))}
            {leads.length === 0 && (
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border/30 text-[11px] text-muted-foreground">
                Arraste leads aqui
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </motion.div>
  )
}
