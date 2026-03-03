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
import { Loader2, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser, useUsers } from '@/hooks/use-user'
import { jidToPhone } from '@/lib/evolution/utils'
import { toast } from 'sonner'
import type { WhatsAppContact } from '@/types'

interface ConvertToLeadModalProps {
  contact: WhatsAppContact | null
  open: boolean
  onClose: () => void
  onConverted: () => void
}

export function ConvertToLeadModal({ contact, open, onClose, onConverted }: ConvertToLeadModalProps) {
  const supabase = createClient()
  const { user } = useUser()
  const { users } = useUsers()

  const [form, setForm] = useState({
    nome: '',
    ddd: '',
    telefone: '',
    email: '',
    cidade: '',
    estado: '',
    especialidade: '',
    faturamento: '',
    observacoes: '',
    assigned_to: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (contact && open) {
      const phone = jidToPhone(contact.remote_jid)
      // Remove country code 55
      const local = phone.startsWith('55') ? phone.slice(2) : phone
      const ddd = local.length >= 10 ? local.slice(0, 2) : ''
      const telefone = local.length >= 10 ? local.slice(2) : local

      setForm({
        nome: contact.nome || contact.push_name || '',
        ddd,
        telefone,
        email: '',
        cidade: '',
        estado: '',
        especialidade: '',
        faturamento: '',
        observacoes: contact.observacoes || '',
        assigned_to: user?.id || '',
      })
    }
  }, [contact, open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (!form.assigned_to) {
      toast.error('Selecione um responsável')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('leads').insert({
      nome: form.nome.trim(),
      ddd: form.ddd || null,
      telefone: form.telefone || null,
      email: form.email || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      especialidade: form.especialidade || null,
      faturamento: form.faturamento ? parseFloat(form.faturamento) : null,
      observacoes: form.observacoes || null,
      status: 'novo',
      assigned_to: form.assigned_to,
      resposta: false,
    })

    if (error) {
      toast.error('Erro ao criar lead: ' + error.message)
    } else {
      toast.success('Lead criado com sucesso!')
      onConverted()
      onClose()
    }

    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-border/50 bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Converter em Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome do lead"
              />
            </div>

            <div>
              <Label>DDD</Label>
              <Input
                value={form.ddd}
                onChange={(e) => setForm({ ...form, ddd: e.target.value })}
                placeholder="11"
                maxLength={2}
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="999999999"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label>Especialidade</Label>
              <Input
                value={form.especialidade}
                onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                placeholder="Especialidade"
              />
            </div>

            <div>
              <Label>Cidade</Label>
              <Input
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Input
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                placeholder="UF"
                maxLength={2}
              />
            </div>

            <div>
              <Label>Faturamento</Label>
              <Input
                type="number"
                value={form.faturamento}
                onChange={(e) => setForm({ ...form, faturamento: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Responsável *</Label>
              <Select
                value={form.assigned_to}
                onValueChange={(v) => setForm({ ...form, assigned_to: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Notas sobre o lead..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Criar Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
