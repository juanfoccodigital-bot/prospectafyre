'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { KanbanStats } from '@/components/kanban/kanban-stats'
import { UpcomingMeetings } from '@/components/meetings/upcoming-meetings'
import { DateFilter } from '@/components/shared/date-filter'
import { useUser } from '@/hooks/use-user'
import { Skeleton } from '@/components/ui/skeleton'
import type { DateRange } from '@/types'

export default function KanbanPage() {
  const { user, loading } = useUser()
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 min-w-0"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kanban</h1>
          <p className="text-sm text-muted-foreground">
            Meus leads - Arraste para alterar o status
          </p>
        </div>
        <DateFilter dateRange={dateRange} onChange={setDateRange} />
      </div>

      {user && (
        <>
          <KanbanBoard userId={user.id} dateRange={dateRange} />
          <UpcomingMeetings />
          <KanbanStats userId={user.id} dateRange={dateRange} />
        </>
      )}
    </motion.div>
  )
}
