'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MeetingCard } from '@/components/meetings/meeting-card'
import { MeetingModal } from '@/components/meetings/meeting-modal'
import { useMeetings } from '@/hooks/use-meetings'
import { useUser } from '@/hooks/use-user'
import { Skeleton } from '@/components/ui/skeleton'
import type { Meeting, MeetingStatus } from '@/types'
import { toast } from 'sonner'

type TabFilter = MeetingStatus | 'todas'

export default function ReunioesPage() {
  const { meetings, loading, refetch, updateMeeting, deleteMeeting } = useMeetings()
  const { user } = useUser()
  const [tab, setTab] = useState<TabFilter>('agendada')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  const filtered = useMemo(() => {
    if (tab === 'todas') return meetings
    return meetings.filter((m) => m.status === tab)
  }, [meetings, tab])

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Meeting[]> = {}
    filtered.forEach((m) => {
      const dateKey = new Date(m.scheduled_at).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(m)
    })
    return groups
  }, [filtered])

  const handleNew = () => {
    setSelectedMeeting(null)
    setModalOpen(true)
  }

  const handleEdit = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setModalOpen(true)
  }

  const handleMarkDone = async (meeting: Meeting) => {
    await updateMeeting(meeting.id, { status: 'realizada' })
    toast.success('Reunião marcada como realizada')
  }

  const handleCancel = async (meeting: Meeting) => {
    await updateMeeting(meeting.id, { status: 'cancelada' })
    toast.success('Reunião cancelada')
  }

  const handleDelete = async (meeting: Meeting) => {
    if (!confirm(`Deletar a reunião "${meeting.titulo}"?`)) return
    await deleteMeeting(meeting.id)
    toast.success('Reunião deletada')
  }

  if (!user) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reuniões</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas reuniões e agendamentos
          </p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Reunião
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)}>
        <TabsList className="bg-background/50">
          <TabsTrigger value="agendada">Próximas</TabsTrigger>
          <TabsTrigger value="realizada">Realizadas</TabsTrigger>
          <TabsTrigger value="cancelada">Canceladas</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border/50 bg-card/80">
          <p className="text-sm text-muted-foreground">Nenhuma reunião encontrada</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, dayMeetings]) => (
            <div key={dateLabel}>
              <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                {dateLabel}
              </p>
              <div className="space-y-2">
                {dayMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onEdit={handleEdit}
                    onMarkDone={handleMarkDone}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <MeetingModal
        meeting={selectedMeeting}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedMeeting(null)
        }}
        onSave={refetch}
        userId={user.id}
      />
    </motion.div>
  )
}
