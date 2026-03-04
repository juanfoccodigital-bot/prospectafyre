'use client'

import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Phone, GripVertical, MessageCircle } from 'lucide-react'
import type { Lead } from '@/types'

interface KanbanCardProps {
  lead: Lead
  isDragging?: boolean
  onCardClick?: (lead: Lead) => void
}

export function KanbanCard({ lead, isDragging, onCardClick }: KanbanCardProps) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragging = isDragging || isSortableDragging

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStart.current || !onCardClick) return
    const dx = Math.abs(e.clientX - pointerStart.current.x)
    const dy = Math.abs(e.clientY - pointerStart.current.y)
    if (dx < 5 && dy < 5) {
      onCardClick(lead)
    }
    pointerStart.current = null
  }

  const fullPhone = (lead.ddd || '') + (lead.telefone?.replace(/\D/g, '') || '')

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={`group cursor-pointer rounded-lg border bg-card px-3 py-2 transition-all duration-200 ${
        dragging
          ? 'scale-105 border-primary/50 shadow-xl shadow-primary/10 rotate-1'
          : 'border-border/30 hover:border-border hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          {...listeners}
          className="shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{lead.nome}</p>
          {lead.especialidade && (
            <p className="truncate text-[11px] text-muted-foreground">{lead.especialidade}</p>
          )}
        </div>

        {fullPhone && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.open(`https://wa.me/55${fullPhone}`, '_blank')
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="shrink-0 rounded-md bg-green-500/10 p-1.5 text-green-500 transition-colors hover:bg-green-500/20"
            title="Abrir WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
        )}
        {!fullPhone && lead.telefone && (
          <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
      </div>

      {lead.resposta && (
        <div className="mt-1 ml-5.5 inline-flex items-center rounded-full bg-fyre/10 px-1.5 py-0.5 text-[9px] font-medium text-fyre">
          Respondeu
        </div>
      )}
    </div>
  )
}
