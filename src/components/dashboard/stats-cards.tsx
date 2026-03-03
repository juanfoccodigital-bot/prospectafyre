'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStats } from '@/hooks/use-stats'
import { Users, Phone, Rocket, TrendingUp, TrendingDown, Target, BarChart3, DollarSign } from 'lucide-react'
import type { DateRange } from '@/types'

function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) return

    const incrementTime = (duration * 1000) / end
    const timer = setInterval(() => {
      start += 1
      setCount(start)
      if (start >= end) clearInterval(timer)
    }, Math.max(incrementTime, 10))

    return () => clearInterval(timer)
  }, [value, duration])

  return <span>{count}</span>
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function StatsCards({ dateRange }: { dateRange?: DateRange }) {
  const { stats, loading } = useDashboardStats(dateRange)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const cards: {
    title: string
    value: number | string
    icon: typeof Users
    color: string
    bg: string
    suffix?: string
    isCurrency?: boolean
  }[] = [
    {
      title: 'Total de Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Contatados',
      value: stats.leadsContatados,
      icon: Phone,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      title: 'Fechados',
      value: stats.leadsFechados,
      icon: Rocket,
      color: 'text-fyre',
      bg: 'bg-fyre/10',
    },
    {
      title: 'Faturamento',
      value: stats.faturamentoFechado,
      icon: DollarSign,
      color: 'text-fyre',
      bg: 'bg-fyre/10',
      isCurrency: true,
    },
    {
      title: 'Taxa Conversão',
      value: Math.round(stats.taxaConversao),
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      suffix: '%',
    },
    {
      title: 'Taxa Resposta',
      value: Math.round(stats.taxaResposta),
      icon: BarChart3,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      suffix: '%',
    },
    {
      title: 'Perdidos',
      value: stats.leadsPerdidos,
      icon: Target,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      title: 'Taxa Churn',
      value: Math.round(stats.taxaChurn),
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      suffix: '%',
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => (
        <motion.div key={card.title} variants={item}>
          <Card className="border-border/50 bg-card/80 transition-all duration-300 hover:border-border hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-1.5 ${card.bg}`}>
                <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {card.isCurrency ? (
                <p className="text-base font-bold truncate">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    notation: 'compact',
                    maximumSignificantDigits: 3,
                  }).format(card.value as number)}
                </p>
              ) : (
                <p className="text-2xl font-bold">
                  <AnimatedCounter value={card.value as number} />
                  {card.suffix}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
