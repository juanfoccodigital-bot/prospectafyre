'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, MapPin, MessageCircle, Copy } from 'lucide-react'
import { LEAD_STATUS_CONFIG, type Lead } from '@/types'
import { toast } from 'sonner'

interface LeadDetailDialogProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadDetailDialog({ lead, open, onOpenChange }: LeadDetailDialogProps) {
  if (!lead) return null

  const config = LEAD_STATUS_CONFIG[lead.status]
  const fullPhone = (lead.ddd || '') + (lead.telefone?.replace(/\D/g, '') || '')

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/50 bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{lead.nome}</DialogTitle>
          <Badge
            variant="outline"
            className="w-fit text-xs"
            style={{ borderColor: `${config.color}40`, color: config.color }}
          >
            {config.emoji} {config.label}
          </Badge>
        </DialogHeader>

        <div className="space-y-4">
          {lead.especialidade && (
            <p className="text-sm text-muted-foreground">{lead.especialidade}</p>
          )}

          {lead.telefone && (
            <div className="flex items-center justify-between rounded-lg border border-border/30 p-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {lead.ddd && `(${lead.ddd}) `}{lead.telefone}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(`${lead.ddd || ''}${lead.telefone}`)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  asChild
                >
                  <a href={`tel:+55${fullPhone}`}>
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {lead.email && (
            <div className="flex items-center justify-between rounded-lg border border-border/30 p-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{lead.email}</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => copyToClipboard(lead.email!)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {lead.cidade && (
            <div className="flex items-center gap-2 rounded-lg border border-border/30 p-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{lead.cidade}/{lead.estado}</span>
            </div>
          )}

          {lead.faturamento && (
            <div className="rounded-lg border border-border/30 p-3">
              <p className="text-xs text-muted-foreground">Faturamento</p>
              <p className="text-sm font-medium text-fyre">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.faturamento)}
              </p>
            </div>
          )}

          {lead.observacoes && (
            <div className="rounded-lg border border-border/30 p-3">
              <p className="text-xs text-muted-foreground">Observações</p>
              <p className="text-sm">{lead.observacoes}</p>
            </div>
          )}

          {fullPhone && (
            <Button
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => window.open(`https://wa.me/55${fullPhone}`, '_blank')}
            >
              <MessageCircle className="h-4 w-4" />
              Abrir WhatsApp
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
