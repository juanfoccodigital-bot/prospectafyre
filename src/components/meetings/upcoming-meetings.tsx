'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowRight, User } from 'lucide-react'
import { useUpcomingMeetings } from '@/hooks/use-meetings'
import { LEAD_STATUS_CONFIG } from '@/types'

export function UpcomingMeetings() {
  const { meetings, loading } = useUpcomingMeetings(5)

  if (loading) {
    return <Skeleton className="h-72" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            Próximas Reuniões
          </CardTitle>
          <Link
            href="/reunioes"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Ver todas <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Nenhuma reunião agendada
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => {
                const date = new Date(meeting.scheduled_at)
                const isToday = new Date().toDateString() === date.toDateString()
                const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                const day = isToday
                  ? 'Hoje'
                  : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

                return (
                  <div
                    key={meeting.id}
                    className="flex items-center gap-3 rounded-lg border border-border/30 bg-background/20 p-3"
                  >
                    <div className="flex flex-col items-center rounded-lg bg-primary/10 px-2.5 py-1.5 text-center">
                      <span className="text-xs font-bold text-primary">{time}</span>
                      <span className="text-[9px] text-muted-foreground">{day}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{meeting.titulo}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {meeting.duration_min}min
                        </span>
                        {meeting.lead && (
                          <span className="flex items-center gap-0.5">
                            <User className="h-2.5 w-2.5" />
                            {meeting.lead.nome}
                          </span>
                        )}
                      </div>
                    </div>
                    {meeting.lead?.status && (
                      <Badge
                        variant="outline"
                        className="shrink-0 text-[8px]"
                        style={{
                          borderColor: `${LEAD_STATUS_CONFIG[meeting.lead.status]?.color}40`,
                          color: LEAD_STATUS_CONFIG[meeting.lead.status]?.color,
                        }}
                      >
                        {LEAD_STATUS_CONFIG[meeting.lead.status]?.label}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
