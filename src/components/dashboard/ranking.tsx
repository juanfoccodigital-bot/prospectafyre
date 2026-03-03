'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useRanking } from '@/hooks/use-stats'
import { Trophy, Medal, Star, Flame } from 'lucide-react'
import type { DateRange } from '@/types'

export function Ranking({ dateRange }: { dateRange?: DateRange }) {
  const { ranking, loading } = useRanking(dateRange)

  if (loading) {
    return <Skeleton className="h-48" />
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-400" />
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />
    return <Star className="h-5 w-5 text-amber-700" />
  }

  const getRankBg = (index: number) => {
    if (index === 0) return 'border-yellow-500/30 bg-yellow-500/5'
    if (index === 1) return 'border-gray-400/30 bg-gray-400/5'
    return 'border-border/50 bg-card/80'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-fyre" />
            Ranking de Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ranking.map((user, index) => {
            const initials = user.userName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            return (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.15 }}
                className={`flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${getRankBg(index)}`}
              >
                <div className="flex h-10 w-10 items-center justify-center">
                  {getRankIcon(index)}
                </div>

                <Avatar className="h-12 w-12 border border-border">
                  {user.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.userName} />
                  )}
                  <AvatarFallback className="bg-primary/20 font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{user.userName}</span>
                    {index === 0 && (
                      <Badge className="bg-fyre text-fyre-foreground text-xs">
                        Top 1
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                    <span>Contatos: {user.contatos}</span>
                    <span>Propostas: {user.propostas}</span>
                    <span>Fechados: {user.fechados}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-fyre">{user.pontuacao}</p>
                  <p className="text-xs text-muted-foreground">pontos</p>
                </div>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}
