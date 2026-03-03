'use client'

import { useState, useCallback, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { X, Plus, Tag } from 'lucide-react'

interface ContactTagsProps {
  remoteJid: string
}

export function ContactTags({ remoteJid }: ContactTagsProps) {
  const [tags, setTags] = useState<string[]>([])
  const [showInput, setShowInput] = useState(false)
  const [newTag, setNewTag] = useState('')

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/tags?remoteJid=${encodeURIComponent(remoteJid)}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setTags(data.map((t: { tag: string }) => t.tag))
      }
    } catch {
      // ignore
    }
  }, [remoteJid])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const addTag = async () => {
    const tag = newTag.trim()
    if (!tag) return
    await fetch('/api/whatsapp/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remoteJid, tag }),
    })
    setNewTag('')
    setShowInput(false)
    fetchTags()
  }

  const removeTag = async (tag: string) => {
    await fetch('/api/whatsapp/tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remoteJid, tag }),
    })
    fetchTags()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addTag()
    if (e.key === 'Escape') {
      setShowInput(false)
      setNewTag('')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className="gap-1 border-primary/30 text-[10px]"
        >
          {tag}
          <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      {showInput ? (
        <Input
          autoFocus
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (!newTag.trim()) setShowInput(false) }}
          placeholder="Tag..."
          className="h-5 w-20 text-[10px] px-1.5"
        />
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <Tag className="h-2.5 w-2.5" />
          <Plus className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  )
}
