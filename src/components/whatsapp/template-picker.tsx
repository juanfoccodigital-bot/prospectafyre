'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Settings } from 'lucide-react'
import type { WhatsAppTemplate, Lead } from '@/types'

interface TemplatePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: WhatsAppTemplate[]
  onSelect: (content: string) => void
  onManage: () => void
  lead?: Lead | null
  trigger: React.ReactNode
}

export function TemplatePicker({
  open,
  onOpenChange,
  templates,
  onSelect,
  onManage,
  lead,
  trigger,
}: TemplatePickerProps) {
  const handleSelect = (template: WhatsAppTemplate) => {
    let content = template.content
    if (lead) {
      content = content
        .replace(/\{\{nome\}\}/gi, lead.nome || '')
        .replace(/\{\{especialidade\}\}/gi, lead.especialidade || '')
        .replace(/\{\{cidade\}\}/gi, lead.cidade || '')
    }
    onSelect(content)
    onOpenChange(false)
  }

  const grouped = templates.reduce<Record<string, WhatsAppTemplate[]>>((acc, t) => {
    const cat = t.category || 'geral'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" side="top">
        <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
          <span className="text-xs font-medium">Templates</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onManage} title="Gerenciar">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
        <ScrollArea className="max-h-60">
          {templates.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              Nenhum template criado
            </p>
          ) : (
            Object.entries(grouped).map(([category, temps]) => (
              <div key={category}>
                <p className="px-3 pt-2 text-[10px] font-medium uppercase text-muted-foreground">
                  {category}
                </p>
                {temps.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                  >
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{t.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{t.content}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
