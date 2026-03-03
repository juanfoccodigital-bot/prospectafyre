'use client'

import { useRef, useState } from 'react'
import { Paperclip, Send, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  onSendText: (text: string) => void
  onSendMedia: (mediatype: string, media: string, caption?: string, fileName?: string) => void
  onOpenTemplates: () => void
  disabled?: boolean
}

export function ChatInput({ onSendText, onSendMedia, onOpenTemplates, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    onSendText(trimmed)
    setText('')
    setSending(false)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string

      let mediatype = 'document'
      if (file.type.startsWith('image/')) mediatype = 'image'
      else if (file.type.startsWith('video/')) mediatype = 'video'
      else if (file.type.startsWith('audio/')) mediatype = 'audio'

      onSendMedia(mediatype, base64, undefined, file.name)
    }
    reader.readAsDataURL(file)

    // Reset input
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="border-t border-border/50 px-4 py-3">
      <div className="flex items-end gap-2">
        {/* Attachment */}
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 shrink-0"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          title="Anexar arquivo"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
        />

        {/* Templates */}
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 shrink-0"
          onClick={onOpenTemplates}
          disabled={disabled}
          title="Templates"
        >
          <FileText className="h-4 w-4" />
        </Button>

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          className="min-h-9 max-h-32 resize-none text-sm"
          rows={1}
          disabled={disabled}
        />

        {/* Send */}
        <Button
          size="icon"
          className="h-9 w-9 shrink-0 bg-green-600 hover:bg-green-700"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          title="Enviar"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
