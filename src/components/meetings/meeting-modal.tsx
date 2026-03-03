'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Meeting, Lead } from '@/types'

interface MeetingModalProps {
  meeting?: Meeting | null
  open: boolean
  onClose: () => void
  onSave: () => void
  defaultLeadId?: string | null
  defaultContactJid?: string | null
  userId: string
}

export function MeetingModal({
  meeting,
  open,
  onClose,
  onSave,
  defaultLeadId,
  defaultContactJid,
  userId,
}: MeetingModalProps) {
  const [form, setForm] = useState({
    titulo: '',
    scheduled_at: '',
    duration_min: '30',
    descricao: '',
    lead_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    if (open) {
      // Load leads for the select
      const supabase = createClient()
      supabase
        .from('leads')
        .select('id, nome, status')
        .order('nome')
        .then(({ data }) => {
          if (data) setLeads(data as Lead[])
        })
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (meeting) {
        const dt = new Date(meeting.scheduled_at)
        const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
        setForm({
          titulo: meeting.titulo,
          scheduled_at: localIso,
          duration_min: String(meeting.duration_min),
          descricao: meeting.descricao || '',
          lead_id: meeting.lead_id || '',
        })
      } else {
        // Default to 1 hour from now
        const now = new Date()
        now.setHours(now.getHours() + 1, 0, 0, 0)
        const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
        setForm({
          titulo: '',
          scheduled_at: localIso,
          duration_min: '30',
          descricao: '',
          lead_id: defaultLeadId || '',
        })
      }
    }
  }, [meeting, open, defaultLeadId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim()) {
      toast.error('Titulo é obrigatório')
      return
    }
    if (!form.scheduled_at) {
      toast.error('Data/hora é obrigatória')
      return
    }

    setSaving(true)

    const url = '/api/meetings'
    const scheduledAt = new Date(form.scheduled_at).toISOString()

    if (meeting) {
      // Update
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: meeting.id,
          titulo: form.titulo.trim(),
          scheduled_at: scheduledAt,
          duration_min: parseInt(form.duration_min),
          descricao: form.descricao || null,
          lead_id: form.lead_id || null,
        }),
      })
      if (res.ok) {
        toast.success('Reunião atualizada')
        onSave()
        onClose()
      } else {
        toast.error('Erro ao atualizar reunião')
      }
    } else {
      // Create
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo.trim(),
          scheduled_at: scheduledAt,
          duration_min: parseInt(form.duration_min),
          descricao: form.descricao || null,
          lead_id: form.lead_id || null,
          contact_jid: defaultContactJid || null,
          created_by: userId,
        }),
      })
      if (res.ok) {
        toast.success('Reunião agendada!')
        onSave()
        onClose()
      } else {
        toast.error('Erro ao agendar reunião')
      }
    }

    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-border/50 bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {meeting ? 'Editar Reunião' : 'Nova Reunião'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex: Apresentação de proposta"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data/Hora *</Label>
              <Input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              />
            </div>
            <div>
              <Label>Duração</Label>
              <Select
                value={form.duration_min}
                onValueChange={(v) => setForm({ ...form, duration_min: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1h30</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Lead vinculado</Label>
            <Select
              value={form.lead_id}
              onValueChange={(v) => setForm({ ...form, lead_id: v === '_none' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Nenhum</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Anotações sobre a reunião..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
              {meeting ? 'Salvar' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
