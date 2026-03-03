'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import { useLeadsByStatus } from '@/hooks/use-leads'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { LeadDetailDialog } from './lead-detail-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { KANBAN_COLUMNS, type Lead, type LeadStatus, type DateRange } from '@/types'
import { toast } from 'sonner'

interface KanbanBoardProps {
  userId: string
  dateRange?: DateRange
}

export function KanbanBoard({ userId, dateRange }: KanbanBoardProps) {
  const { leadsByStatus, loading, refetch } = useLeadsByStatus(userId, dateRange)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const findLeadById = (id: string): Lead | undefined => {
    for (const leads of Object.values(leadsByStatus)) {
      const found = leads.find((l) => l.id === id)
      if (found) return found
    }
    return undefined
  }

  const findColumnForLead = (id: string): LeadStatus | undefined => {
    for (const [status, leads] of Object.entries(leadsByStatus)) {
      if (leads.find((l) => l.id === id)) return status as LeadStatus
    }
    return undefined
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeLeadId = active.id as string
    const overId = over.id as string

    // Determine target column
    let targetColumn: LeadStatus | undefined

    // Check if dropped directly on a column
    if (KANBAN_COLUMNS.includes(overId as LeadStatus)) {
      targetColumn = overId as LeadStatus
    } else {
      // Dropped on another card - find that card's column
      targetColumn = findColumnForLead(overId)
    }

    if (!targetColumn) return

    const sourceColumn = findColumnForLead(activeLeadId)
    if (sourceColumn === targetColumn) return

    // Optimistic update
    const lead = findLeadById(activeLeadId)
    if (!lead) return

    // Update in database
    const { error } = await supabase
      .from('leads')
      .update({ status: targetColumn })
      .eq('id', activeLeadId)

    if (error) {
      toast.error('Erro ao mover lead')
    } else {
      toast.success(`Lead movido para "${targetColumn.replace(/_/g, ' ')}"`)
      refetch()
    }
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-96 w-72 shrink-0" />
        ))}
      </div>
    )
  }

  const activeLead = activeId ? findLeadById(activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            leads={leadsByStatus[status]}
            onCardClick={setSelectedLead}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <KanbanCard lead={activeLead} isDragging /> : null}
      </DragOverlay>

      <LeadDetailDialog
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      />
    </DndContext>
  )
}
