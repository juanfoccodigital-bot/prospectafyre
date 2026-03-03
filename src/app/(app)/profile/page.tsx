'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@/hooks/use-user'
import { useRanking } from '@/hooks/use-stats'
import { useLeads } from '@/hooks/use-leads'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Trophy,
  Target,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
  Camera,
  Save,
  Loader2,
} from 'lucide-react'

export default function ProfilePage() {
  const { user, loading: userLoading, updateUser, uploadAvatar } = useUser()
  const { ranking, loading: rankingLoading } = useRanking()
  const { leads, total, loading: leadsLoading } = useLeads(
    user ? { assigned_to: user.id } : {}
  )

  const [name, setName] = useState('')
  const [nameInit, setNameInit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync name from user once loaded
  if (user && !nameInit) {
    setName(user.name || '')
    setNameInit(true)
  }

  const loading = userLoading || rankingLoading || leadsLoading
  const userScore = ranking.find((r) => r.userId === user?.id)
  const userRank = ranking.findIndex((r) => r.userId === user?.id) + 1

  const fechados = leads.filter((l) => l.status === 'fechado').length
  const contatados = leads.filter((l) => l.status !== 'novo').length
  const comResposta = leads.filter((l) => l.resposta).length
  const taxaConversao = total > 0 ? ((fechados / total) * 100).toFixed(1) : '0'
  const taxaResposta = total > 0 ? ((comResposta / total) * 100).toFixed(1) : '0'

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  const handleSaveName = async () => {
    if (!name.trim()) return
    setSaving(true)
    setMessage(null)
    const { error } = await updateUser({ name: name.trim() })
    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: error })
    } else {
      setMessage({ type: 'success', text: 'Nome atualizado!' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMessage(null)
    const { error } = await uploadAvatar(file)
    setUploading(false)
    if (error) {
      setMessage({ type: 'error', text: error })
    } else {
      setMessage({ type: 'success', text: 'Foto atualizada!' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const nameChanged = name.trim() !== (user?.name || '')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Edite suas informações e acompanhe sua performance
        </p>
      </div>

      {/* Profile Edit Card */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
          {/* Avatar with upload */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-24 w-24 border-2 border-primary">
                {user?.avatar_url && (
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                )}
                <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <span className="text-xs text-muted-foreground">Clique para trocar</span>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                {user?.role === 'admin' ? 'Admin' : 'Usuário'}
              </Badge>
              {userRank === 1 && (
                <Badge className="gap-1 bg-fyre text-fyre-foreground">
                  <Trophy className="h-3 w-3" />
                  #1 Ranking
                </Badge>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    onKeyDown={(e) => e.key === 'Enter' && nameChanged && handleSaveName()}
                  />
                  <Button
                    size="icon"
                    onClick={handleSaveName}
                    disabled={saving || !nameChanged}
                    className="shrink-0"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="opacity-60" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Pontuação:</span>
              <span className="text-lg font-bold text-fyre">{userScore?.pontuacao || 0} pts</span>
            </div>

            {message && (
              <p className={`text-sm ${message.type === 'success' ? 'text-fyre' : 'text-destructive'}`}>
                {message.text}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leads Atribuídos</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{total}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-fyre" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{taxaConversao}%</p>
              <Progress value={parseFloat(taxaConversao)} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Resposta</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{taxaResposta}%</p>
              <Progress value={parseFloat(taxaResposta)} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fechados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-fyre">{fechados}</p>
              <p className="text-xs text-muted-foreground">de {total} leads</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle>Resumo de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Contatados</p>
              <p className="text-2xl font-bold">{contatados}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Com Resposta</p>
              <p className="text-2xl font-bold">{comResposta}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Propostas Enviadas</p>
              <p className="text-2xl font-bold">
                {leads.filter((l) => l.status === 'proposta_enviada' || l.status === 'fechado').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Em Conversa</p>
              <p className="text-2xl font-bold">
                {leads.filter((l) => l.status === 'em_conversa').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Perdidos</p>
              <p className="text-2xl font-bold text-destructive">
                {leads.filter((l) => l.status === 'perdido').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Posição no Ranking</p>
              <p className="text-2xl font-bold text-primary">#{userRank || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
