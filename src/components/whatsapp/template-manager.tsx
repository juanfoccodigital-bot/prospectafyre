'use client'

import { useState } from 'react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Plus } from 'lucide-react'
import type { WhatsAppTemplate } from '@/types'

interface TemplateManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: WhatsAppTemplate[]
  onCreate: (name: string, content: string, category?: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

const CATEGORIES = [
  { value: 'saudacao', label: 'Saudacao' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'geral', label: 'Geral' },
]

export function TemplateManager({
  open,
  onOpenChange,
  templates,
  onCreate,
  onDelete,
}: TemplateManagerProps) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('geral')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || !content.trim()) return
    setCreating(true)
    await onCreate(name.trim(), content.trim(), category)
    setName('')
    setContent('')
    setCategory('geral')
    setCreating(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/50 bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Templates</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create form */}
          <div className="space-y-3 rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Novo Template</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Saudacao Inicial"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Conteudo</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ola {{nome}}, tudo bem? Sou da ProspectaFyre..."
                className="min-h-16 text-xs"
                rows={3}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Use {'{{nome}}'}, {'{{especialidade}}'}, {'{{cidade}}'} para variaveis
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={creating || !name.trim() || !content.trim()}
              className="w-full"
            >
              Criar Template
            </Button>
          </div>

          {/* List */}
          <ScrollArea className="max-h-60">
            <div className="space-y-1">
              {templates.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Nenhum template criado
                </p>
              ) : (
                templates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-border/30 p-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium">{t.name}</p>
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                          {t.category}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                        {t.content}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => onDelete(t.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
