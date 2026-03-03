'use client'

import { useRef, useState } from 'react'
import { Check, CheckCheck, Download, FileText, Pause, Play } from 'lucide-react'
import type { WhatsAppMessage } from '@/types'

interface MessageBubbleProps {
  message: WhatsAppMessage
}

function getMediaSrc(url: string, mime?: string | null): string {
  if (url.startsWith('data:')) return url
  if (url.startsWith('http')) return url
  // Raw base64 — add data: prefix
  const mimeType = mime || 'application/octet-stream'
  return `data:${mimeType};base64,${url}`
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'
  const time = new Date(message.created_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
          isOutbound
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md bg-card border border-border/50'
        }`}
      >
        {/* Image */}
        {message.media_type === 'image' && message.media_url && (
          <div className="-mx-1 -mt-0.5 mb-1.5">
            <img
              src={getMediaSrc(message.media_url, message.media_mime_type)}
              alt=""
              className="max-h-64 cursor-pointer rounded-lg object-cover"
              onClick={() => window.open(getMediaSrc(message.media_url!, message.media_mime_type), '_blank')}
            />
          </div>
        )}

        {/* Video */}
        {message.media_type === 'video' && message.media_url && (
          <div className="-mx-1 -mt-0.5 mb-1.5">
            <video
              src={getMediaSrc(message.media_url, message.media_mime_type)}
              controls
              className="max-h-64 rounded-lg"
              preload="metadata"
            />
          </div>
        )}

        {/* Audio */}
        {message.media_type === 'audio' && message.media_url && (
          <AudioPlayer src={getMediaSrc(message.media_url, message.media_mime_type)} isOutbound={isOutbound} />
        )}

        {/* Document */}
        {message.media_type === 'document' && message.media_url && (
          <a
            href={getMediaSrc(message.media_url, message.media_mime_type)}
            download={message.file_name || 'documento'}
            className={`mb-1.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 ${
              isOutbound ? 'bg-white/10' : 'bg-muted/50'
            }`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isOutbound ? 'bg-white/10' : 'bg-primary/10'
            }`}>
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{message.file_name || 'Documento'}</p>
              <p className={`text-[10px] ${isOutbound ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
                {message.media_mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
              </p>
            </div>
            <Download className="h-4 w-4 shrink-0 opacity-50" />
          </a>
        )}

        {/* Fallback for media without base64 */}
        {message.media_type && !message.media_url && (
          <p className="text-sm italic opacity-60">
            {message.media_type === 'image' ? 'Imagem' :
             message.media_type === 'video' ? 'Vídeo' :
             message.media_type === 'audio' ? 'Áudio' : 'Arquivo'}
          </p>
        )}

        {/* Text content */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
        )}

        {/* Time and status */}
        <div className={`mt-1 flex items-center justify-end gap-1 ${isOutbound ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
          <span className="text-[10px]">{time}</span>
          {isOutbound && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  )
}

function AudioPlayer({ src, isOutbound }: { src: string; isOutbound: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  const isValidDuration = (d: number) => Number.isFinite(d) && d > 0 && d < 36000

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const formatTime = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className={`mb-1.5 flex items-center gap-2.5 rounded-lg px-3 py-2 ${
      isOutbound ? 'bg-white/10' : 'bg-muted/50'
    }`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => {
          const d = audioRef.current?.duration || 0
          if (isValidDuration(d)) setDuration(d)
        }}
        onDurationChange={() => {
          const d = audioRef.current?.duration || 0
          if (isValidDuration(d)) setDuration(d)
        }}
        onTimeUpdate={() => {
          const a = audioRef.current
          if (!a) return
          setElapsed(a.currentTime)
          if (isValidDuration(a.duration)) {
            setDuration(a.duration)
            setProgress((a.currentTime / a.duration) * 100)
          }
        }}
        onEnded={() => { setPlaying(false); setProgress(0); setElapsed(0) }}
      />
      <button onClick={togglePlay} className="shrink-0">
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
      <div className="flex-1">
        <div className={`h-1 rounded-full ${isOutbound ? 'bg-white/20' : 'bg-border'}`}>
          <div
            className={`h-1 rounded-full transition-all ${isOutbound ? 'bg-white/70' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-[10px] tabular-nums opacity-60">
        {playing ? formatTime(elapsed) : (isValidDuration(duration) ? formatTime(duration) : '0:00')}
      </span>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'read') return <CheckCheck className="h-3 w-3 text-blue-300" />
  if (status === 'delivered') return <CheckCheck className="h-3 w-3" />
  return <Check className="h-3 w-3" />
}
