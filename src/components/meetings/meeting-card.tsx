'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, CheckCircle, Clock, Edit, Trash2, XCircle, User } from 'lucide-react'
import type { Meeting } from '@/types'
import { LEAD_STATUS_CONFIG } from '@/types'

interface MeetingCardProps {
  meeting: Meeting
  onEdit: (meeting: Meeting) => void
  onMarkDone: (meeting: Meeting) => void
  onCancel: (meeting: Meeting) => void
  onDelete: (meeting: Meeting) => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Calendar }> = {
  agendada: { label: 'Agendada', color: '#42A5F5', icon: Calendar },
  realizada: { label: 'Realizada', color: '#C0DB52', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: '#EF5350', icon: XCircle },
}

export function MeetingCard({ meeting, onEdit, onMarkDone, onCancel, onDelete }: MeetingCardProps) {
  const config = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.agendada
  const StatusIcon = config.icon

  const date = new Date(meeting.scheduled_at)
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const fullDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  const lead = meeting.lead

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/50 bg-card/80 transition-all hover:border-border">
        <CardContent className="flex items-center gap-4 p-4">
          {/* Time block */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-primary/10 px-3 py-2 text-center">
            <span className="text-lg font-bold text-primary">{time}</span>
            <span className="text-[10px] text-muted-foreground">{fullDate}</span>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{meeting.titulo}</p>
              <Badge
                variant="outline"
                className="shrink-0 text-[9px]"
                style={{ borderColor: `${config.color}40`, color: config.color }}
              >
                <StatusIcon className="mr-1 h-2.5 w-2.5" />
                {config.label}
              </Badge>
            </div>

            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {meeting.duration_min}min
              </span>
              {lead && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {lead.nome}
                  {lead.status && (
                    <Badge
                      variant="outline"
                      className="ml-1 text-[8px]"
                      style={{
                        borderColor: `${LEAD_STATUS_CONFIG[lead.status]?.color}40`,
                        color: LEAD_STATUS_CONFIG[lead.status]?.color,
                      }}
                    >
                      {LEAD_STATUS_CONFIG[lead.status]?.label}
                    </Badge>
                  )}
                </span>
              )}
              {meeting.creator && (
                <span className="text-[10px]">por {meeting.creator.name}</span>
              )}
            </div>

            {meeting.descricao && (
              <p className="mt-1 truncate text-xs text-muted-foreground">{meeting.descricao}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {meeting.status === 'agendada' && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-[var(--fyre)] hover:text-[var(--fyre)]"
                  title="Marcar como realizada"
                  onClick={() => onMarkDone(meeting)}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Cancelar"
                  onClick={() => onCancel(meeting)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title="Editar"
              onClick={() => onEdit(meeting)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              title="Deletar"
              onClick={() => onDelete(meeting)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
