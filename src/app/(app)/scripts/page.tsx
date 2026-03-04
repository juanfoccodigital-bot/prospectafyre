'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Copy, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useWhatsAppTemplates } from '@/hooks/use-whatsapp-templates'
import { toast } from 'sonner'

export default function ScriptsPage() {
  const { templates, loading, createTemplate, deleteTemplate } = useWhatsAppTemplates()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q)
    )
  })

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  const handleCreate = async () => {
    if (!name.trim() || !content.trim()) {
      toast.error('Preencha nome e conteúdo')
      return
    }
    const ok = await createTemplate(name.trim(), content.trim(), category.trim() || 'geral')
    if (ok) {
      toast.success('Script criado!')
      setModalOpen(false)
      setName('')
      setContent('')
      setCategory('')
    } else {
      toast.error('Erro ao criar script')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await deleteTemplate(id)
    if (ok) {
      toast.success('Script removido')
    } else {
      toast.error('Erro ao remover')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scripts</h1>
          <p className="text-sm text-muted-foreground">
            Templates de mensagem para copiar e usar no WhatsApp
          </p>
        </div>
        <Button className="gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo Script
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar scripts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted-foreground">
            {search ? 'Nenhum script encontrado' : 'Nenhum script criado ainda'}
          </p>
          {!search && (
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Criar primeiro script
            </Button>
          )}
        </div>
      )}

      {/* Cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="group flex flex-col rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-border"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight">{t.name}</h3>
                {t.category && t.category !== 'geral' && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {t.category}
                  </Badge>
                )}
              </div>

              <p className="mb-4 flex-1 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {t.content}
              </p>

              <div className="flex items-center gap-2 border-t border-border/30 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => handleCopy(t.content)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-border/50 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Script</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nome</label>
              <Input
                placeholder="Ex: Primeiro contato"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Categoria</label>
              <Input
                placeholder="Ex: prospecção, follow-up, proposta..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Conteúdo</label>
              <Textarea
                placeholder="Escreva o script aqui..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
            </div>
            <Button className="w-full" onClick={handleCreate}>
              Criar Script
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
