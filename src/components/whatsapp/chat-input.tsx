'use client'

import { useCallback, useRef, useState } from 'react'
import { Paperclip, Send, FileText, Mic, Square } from 'lucide-react'
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
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop())

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          onSendMedia('audio', base64, undefined, 'audio.webm')
        }
        reader.readAsDataURL(blob)
      }

      mediaRecorder.start(250)
      mediaRecorderRef.current = mediaRecorder
      setRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch {
      // Permission denied or not available
    }
  }, [onSendMedia])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null
    setRecording(false)
    setRecordingTime(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      // Remove the onstop handler so it doesn't send
      mediaRecorderRef.current.onstop = () => {
        // Stop all tracks without sending
        const stream = mediaRecorderRef.current?.stream
        stream?.getTracks().forEach((t) => t.stop())
      }
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    setRecording(false)
    setRecordingTime(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="border-t border-border/50 px-4 py-3">
      {recording ? (
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
            onClick={cancelRecording}
            title="Cancelar"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>

          <div className="flex flex-1 items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm text-red-400">Gravando {formatTime(recordingTime)}</span>
          </div>

          <Button
            size="icon"
            className="h-9 w-9 shrink-0 bg-green-600 hover:bg-green-700"
            onClick={stopRecording}
            title="Enviar áudio"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
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

          {/* Send or Record */}
          {text.trim() ? (
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 bg-green-600 hover:bg-green-700"
              onClick={handleSend}
              disabled={disabled || sending}
              title="Enviar"
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 bg-green-600 hover:bg-green-700"
              onClick={startRecording}
              disabled={disabled}
              title="Gravar áudio"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
