'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import { fetchAllRows } from '@/lib/supabase/fetch-all'
import { getDddRegion } from '@/hooks/use-stats'
import { LEAD_STATUS_CONFIG, type Lead, type LeadStatus, type DateRange } from '@/types'
import {
  Users,
  Phone,
  Rocket,
  TrendingUp,
  DollarSign,
  Target,
  MessageCircle,
} from 'lucide-react'

interface KanbanStatsProps {
  userId: string
  dateRange?: DateRange
}

interface KanbanStatsData {
  total: number
  contatados: number
  propostas: number
  fechados: number
  perdidos: number
  respostas: number
  faturamentoTotal: number
  taxaConversao: number
  statusData: { name: string; value: number; fill: string }[]
  espData: { name: string; value: number }[]
  dddData: { name: string; ddd: string; value: number }[]
  recentLeads: Lead[]
}

const COLORS = [
  '#5026D3', '#C0DB52', '#42A5F5', '#FF6B6B', '#FFA726',
  '#7C4DFF', '#26A69A', '#EF5350', '#AB47BC', '#78909C',
]

export function KanbanStats({ userId, dateRange }: KanbanStatsProps) {
  const [data, setData] = useState<KanbanStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const rangeKey = JSON.stringify(dateRange)

  const fetchStats = useCallback(async () => {
    setLoading(true)

    const filters: { eq?: [string, string][]; gte?: [string, string][]; lte?: [string, string][] } = {
      eq: [['assigned_to', userId]],
    }
    if (dateRange?.from) filters.gte = [['created_at', dateRange.from]]
    if (dateRange?.to) filters.lte = [['created_at', dateRange.to + 'T23:59:59.999Z']]

    const leads = await fetchAllRows<Lead>(
      supabase, 'leads', '*', filters,
      { column: 'updated_at', ascending: false }
    )

    if (leads.length > 0) {
      let contatados = 0
      let propostas = 0
      let fechados = 0
      let perdidos = 0
      let respostas = 0
      let faturamentoTotal = 0
      const statusCount: Record<string, number> = {}
      const espCount: Record<string, number> = {}
      const dddCount: Record<string, number> = {}

      leads.forEach((lead) => {
        if (lead.status !== 'novo') contatados++
        if (lead.status === 'proposta_enviada' || lead.status === 'fechado') propostas++
        if (lead.status === 'fechado') fechados++
        if (lead.status === 'perdido') perdidos++
        if (lead.resposta) respostas++
        if (lead.faturamento) faturamentoTotal += lead.faturamento

        statusCount[lead.status] = (statusCount[lead.status] || 0) + 1

        const esp = lead.especialidade?.trim()
        if (esp) espCount[esp] = (espCount[esp] || 0) + 1

        const ddd = lead.ddd?.trim()
        if (ddd) dddCount[ddd] = (dddCount[ddd] || 0) + 1
      })

      const statusColors: Record<string, string> = {
        novo: '#FF6B6B',
        tentando_contato: '#FFA726',
        em_conversa: '#42A5F5',
        proposta_enviada: '#7C4DFF',
        fechado: '#C0DB52',
        perdido: '#EF5350',
      }

      setData({
        total: leads.length,
        contatados,
        propostas,
        fechados,
        perdidos,
        respostas,
        faturamentoTotal,
        taxaConversao: leads.length > 0 ? (fechados / leads.length) * 100 : 0,
        statusData: Object.entries(statusCount)
          .filter(([, v]) => v > 0)
          .map(([status, value]) => ({
            name: LEAD_STATUS_CONFIG[status as LeadStatus]?.label || status,
            value,
            fill: statusColors[status] || '#888',
          })),
        espData: Object.entries(espCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8),
        dddData: Object.entries(dddCount)
          .map(([ddd, value]) => ({ name: getDddRegion(ddd), ddd, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8),
        recentLeads: leads.slice(0, 10) as Lead[],
      })
    }
    setLoading(false)
  }, [userId, rangeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const statCards = [
    { title: 'Meus Leads', value: data.total, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Contatados', value: data.contatados, icon: Phone, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Propostas', value: data.propostas, icon: Target, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { title: 'Fechados', value: data.fechados, icon: Rocket, color: 'text-fyre', bg: 'bg-fyre/10' },
    { title: 'Respostas', value: data.respostas, icon: MessageCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
    { title: 'Conversão', value: `${Math.round(data.taxaConversao)}%`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10', isText: true },
    { title: 'Fat. do Fluxo', value: data.faturamentoTotal, icon: DollarSign, color: 'text-fyre', bg: 'bg-fyre/10', isCurrency: true },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7"
      >
        {statCards.map((card) => (
          <Card key={card.title} className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-1.5 ${card.bg}`}>
                <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`font-bold truncate ${card.isCurrency ? 'text-base' : 'text-2xl'}`}>
                {card.isCurrency
                  ? new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      notation: 'compact',
                      maximumSignificantDigits: 3,
                    }).format(card.value as number)
                  : card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie - Status Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {data.statusData.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                  Sem dados
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={1200}
                    >
                      {data.statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                            <p className="text-sm font-medium" style={{ color: payload[0].payload.fill }}>
                              {payload[0].name}: {payload[0].value}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar - Especialidade */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Leads por Especialidade</CardTitle>
            </CardHeader>
            <CardContent>
              {data.espData.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                  Sem dados de especialidade
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.espData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#A0A0A0', fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: '#A0A0A0', fontSize: 11 }}
                      width={110}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                            <p className="text-sm font-medium text-primary">
                              {payload[0].payload.name}: {payload[0].value}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]} animationDuration={1200}>
                      {data.espData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar - Região/DDD */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Leads por Região (DDD)</CardTitle>
            </CardHeader>
            <CardContent>
              {data.dddData.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                  Sem dados de DDD
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.dddData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#A0A0A0', fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      height={55}
                    />
                    <YAxis tick={{ fill: '#A0A0A0', fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                            <p className="text-xs text-muted-foreground">DDD {d.ddd}</p>
                            <p className="text-sm font-medium text-primary">{d.name}</p>
                            <p className="text-sm font-bold">{d.value} leads</p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]} animationDuration={1200}>
                      {data.dddData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Leads Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Últimos Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentLeads.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                  Nenhum lead encontrado
                </div>
              ) : (
                <div className="max-h-[260px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-xs">Nome</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">DDD</TableHead>
                        <TableHead className="text-xs text-right">Faturamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentLeads.map((lead) => {
                        const config = LEAD_STATUS_CONFIG[lead.status]
                        return (
                          <TableRow key={lead.id} className="border-border/30">
                            <TableCell className="text-sm">{lead.nome}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                                style={{ borderColor: `${config.color}40`, color: config.color }}
                              >
                                {config.emoji} {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {lead.ddd || '—'}
                            </TableCell>
                            <TableCell className="text-right text-xs font-medium text-fyre">
                              {lead.faturamento
                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(lead.faturamento)
                                : '—'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
