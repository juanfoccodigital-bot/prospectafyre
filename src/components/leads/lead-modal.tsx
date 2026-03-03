'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, Mail, MessageSquare, Clock, Save, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser, useUsers } from '@/hooks/use-user'
import { useInteractions } from '@/hooks/use-leads'
import type { Lead, LeadStatus, InteractionType } from '@/types'
import { LEAD_STATUS_CONFIG } from '@/types'
import { toast } from 'sonner'

interface LeadModalProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
  onSave: () => void
}

export function LeadModal({ lead, open, onClose, onSave }: LeadModalProps) {
  const supabase = createClient()
  const { user } = useUser()
  const { users } = useUsers()
  const { interactions, refetch: refetchInteractions } = useInteractions(lead?.id || '')

  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    cidade: '',
    estado: '',
    ddd: '',
    especialidade: '',
    faturamento: '',
    valor_fechamento: '',
    status: 'novo' as LeadStatus,
    assigned_to: '',
    observacoes: '',
    resposta: false,
  })
  const [saving, setSaving] = useState(false)
  const [newInteraction, setNewInteraction] = useState({
    tipo: 'ligacao' as InteractionType,
    descricao: '',
  })

  useEffect(() => {
    if (lead) {
      setForm({
        nome: lead.nome,
        telefone: lead.telefone || '',
        email: lead.email || '',
        cidade: lead.cidade || '',
        estado: lead.estado || '',
        ddd: lead.ddd || '',
        especialidade: lead.especialidade || '',
        faturamento: lead.faturamento?.toString() || '',
        valor_fechamento: lead.valor_fechamento?.toString() || '',
        status: lead.status,
        assigned_to: lead.assigned_to,
        observacoes: lead.observacoes || '',
        resposta: lead.resposta,
      })
    }
  }, [lead])

  const handleSave = async () => {
    if (!lead) return
    setSaving(true)

    const { error } = await supabase
      .from('leads')
      .update({
        nome: form.nome,
        telefone: form.telefone || null,
        email: form.email || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        ddd: form.ddd || null,
        especialidade: form.especialidade || null,
        faturamento: form.faturamento ? parseFloat(form.faturamento) : null,
        valor_fechamento: form.valor_fechamento ? parseFloat(form.valor_fechamento) : null,
        status: form.status,
        assigned_to: form.assigned_to,
        observacoes: form.observacoes || null,
        resposta: form.resposta,
      })
      .eq('id', lead.id)

    if (error) {
      toast.error('Erro ao salvar lead')
    } else {
      toast.success('Lead atualizado com sucesso')
      onSave()
    }
    setSaving(false)
  }

  const handleMarkContacted = async () => {
    if (!lead) return

    await supabase
      .from('leads')
      .update({ ultimo_contato: new Date().toISOString() })
      .eq('id', lead.id)

    toast.success('Marcado como contatado')
  }

  const handleAddInteraction = async () => {
    if (!lead || !user || !newInteraction.descricao.trim()) return

    const { error } = await supabase.from('interactions').insert({
      lead_id: lead.id,
      user_id: user.id,
      tipo: newInteraction.tipo,
      descricao: newInteraction.descricao,
    })

    if (error) {
      toast.error('Erro ao adicionar interação')
    } else {
      toast.success('Interação registrada')
      setNewInteraction({ tipo: 'ligacao', descricao: '' })
      refetchInteractions()
    }
  }

  const interactionTypeLabels: Record<InteractionType, { label: string; icon: React.ReactNode }> = {
    ligacao: { label: 'Ligação', icon: <Phone className="h-3 w-3" /> },
    whatsapp: { label: 'WhatsApp', icon: <MessageSquare className="h-3 w-3" /> },
    email: { label: 'Email', icon: <Mail className="h-3 w-3" /> },
    outro: { label: 'Outro', icon: <Clock className="h-3 w-3" /> },
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden border-border/50 bg-card p-0">
        <DialogHeader className="border-b border-border/50 px-6 py-4">
          <DialogTitle className="flex items-center gap-3">
            Editar Lead - {lead?.nome}
            {lead && (
              <Badge
                variant="outline"
                style={{
                  borderColor: `${LEAD_STATUS_CONFIG[lead.status].color}40`,
                  backgroundColor: `${LEAD_STATUS_CONFIG[lead.status].color}15`,
                  color: LEAD_STATUS_CONFIG[lead.status].color,
                }}
              >
                {LEAD_STATUS_CONFIG[lead.status].emoji} {LEAD_STATUS_CONFIG[lead.status].label}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="flex-1">
          <TabsList className="mx-6 bg-background/50">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh]">
            <TabsContent value="dados" className="space-y-4 px-6 pb-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label>DDD</Label>
                  <Input
                    value={form.ddd}
                    onChange={(e) => setForm({ ...form, ddd: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label>Especialidade</Label>
                  <Input
                    value={form.especialidade}
                    onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label>Faturamento</Label>
                  <Input
                    type="number"
                    value={form.faturamento}
                    onChange={(e) => setForm({ ...form, faturamento: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label>Valor Fechamento R$</Label>
                  <Input
                    type="number"
                    value={form.valor_fechamento}
                    onChange={(e) => setForm({ ...form, valor_fechamento: e.target.value })}
                    className="bg-background/50"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Separator />

              {/* Status & Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as LeadStatus })}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.emoji} {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Responsável</Label>
                  <Select
                    value={form.assigned_to}
                    onValueChange={(v) => setForm({ ...form, assigned_to: v })}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Response toggle */}
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/30 p-4">
                <div>
                  <p className="font-medium">Resposta recebida?</p>
                  <p className="text-sm text-muted-foreground">Marque se o lead respondeu</p>
                </div>
                <Switch
                  checked={form.resposta}
                  onCheckedChange={(checked) => setForm({ ...form, resposta: checked })}
                />
              </div>

              {/* Notes */}
              <div>
                <Label>Observações internas</Label>
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="min-h-[100px] bg-background/50"
                  placeholder="Anotações sobre o lead..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={handleMarkContacted} variant="outline" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Marcar como contatado
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="historico" className="space-y-4 px-6 pb-6">
              {/* Add interaction */}
              <div className="space-y-3 rounded-xl border border-border/50 bg-background/30 p-4">
                <p className="text-sm font-medium">Nova Interação</p>
                <div className="flex gap-3">
                  <Select
                    value={newInteraction.tipo}
                    onValueChange={(v) => setNewInteraction({ ...newInteraction, tipo: v as InteractionType })}
                  >
                    <SelectTrigger className="w-40 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ligacao">Ligação</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Descreva a interação..."
                    value={newInteraction.descricao}
                    onChange={(e) => setNewInteraction({ ...newInteraction, descricao: e.target.value })}
                    className="bg-background/50"
                  />
                  <Button onClick={handleAddInteraction} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* History */}
              <div className="space-y-3">
                <AnimatePresence>
                  {interactions.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma interação registrada
                    </p>
                  ) : (
                    interactions.map((interaction, index) => {
                      const typeInfo = interactionTypeLabels[interaction.tipo as InteractionType] || interactionTypeLabels.outro
                      return (
                        <motion.div
                          key={interaction.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex gap-3 rounded-xl border border-border/30 bg-background/20 p-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            {typeInfo.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {typeInfo.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {interaction.user?.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(interaction.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{interaction.descricao}</p>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border/50 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
