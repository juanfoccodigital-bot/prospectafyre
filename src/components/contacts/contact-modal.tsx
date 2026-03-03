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
import type { WhatsAppContact } from '@/types'

interface ContactModalProps {
  contact: WhatsAppContact | null
  open: boolean
  onClose: () => void
  onSave: (data: { phone?: string; nome?: string; observacoes?: string }) => Promise<boolean>
}

export function ContactModal({ contact, open, onClose, onSave }: ContactModalProps) {
  const [phone, setPhone] = useState('')
  const [nome, setNome] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)

  const isEdit = !!contact

  useEffect(() => {
    if (contact) {
      const jidPhone = contact.remote_jid.replace(/@.*$/, '')
      setPhone(jidPhone)
      setNome(contact.nome || contact.push_name || '')
      setObservacoes(contact.observacoes || '')
    } else {
      setPhone('')
      setNome('')
      setObservacoes('')
    }
  }, [contact, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEdit && !phone.trim()) return

    setSaving(true)
    const ok = await onSave(
      isEdit
        ? { nome: nome.trim() || undefined, observacoes: observacoes.trim() || undefined }
        : { phone: phone.trim(), nome: nome.trim() || undefined }
    )
    setSaving(false)

    if (ok) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-border/50 bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (com DDD)</Label>
            <Input
              id="phone"
              placeholder="11999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isEdit}
            />
            {!isEdit && (
              <p className="text-[11px] text-muted-foreground">
                Ex: 11999999999 (código do país 55 é adicionado automaticamente)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Nome do contato"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                placeholder="Notas sobre o contato..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || (!isEdit && !phone.trim())}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
