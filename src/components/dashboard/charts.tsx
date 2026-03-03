'use client'

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
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useLeadStatusChart,
  useDailyContactsChart,
  useRanking,
  useLeadsByEspecialidade,
  useLeadsByDDD,
  useRevenueChart,
} from '@/hooks/use-stats'
import type { DateRange } from '@/types'

const COLORS = [
  '#5026D3', '#C0DB52', '#42A5F5', '#FF6B6B', '#FFA726',
  '#7C4DFF', '#26A69A', '#EF5350', '#AB47BC', '#78909C',
  '#EC407A', '#66BB6A',
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
      {label && <p className="mb-1 text-xs text-muted-foreground">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export function DashboardCharts({ dateRange }: { dateRange?: DateRange }) {
  const { data: statusData, loading: statusLoading } = useLeadStatusChart(dateRange)
  const { data: dailyData, loading: dailyLoading } = useDailyContactsChart(dateRange)
  const { ranking, loading: rankingLoading } = useRanking(dateRange)
  const { data: espData, loading: espLoading } = useLeadsByEspecialidade(dateRange)
  const { data: dddData, loading: dddLoading } = useLeadsByDDD(dateRange)
  const { data: revenueData, loading: revenueLoading } = useRevenueChart(dateRange)

  const conversionData = ranking.map((r) => ({
    name: r.userName,
    contatos: r.contatos,
    fechados: r.fechados,
    propostas: r.propostas,
  }))

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Pie Chart - Leads por Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Leads por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Skeleton className="mx-auto h-52 w-52 rounded-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1200}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bar Chart - Conversão por Usuário */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Conversão por Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            {rankingLoading ? (
              <Skeleton className="h-52" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis dataKey="name" tick={{ fill: '#A0A0A0', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#A0A0A0', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="contatos" name="Contatos" fill="#42A5F5" radius={[4, 4, 0, 0]} animationDuration={1200} />
                  <Bar dataKey="propostas" name="Propostas" fill="#7C4DFF" radius={[4, 4, 0, 0]} animationDuration={1200} />
                  <Bar dataKey="fechados" name="Fechados" fill="#C0DB52" radius={[4, 4, 0, 0]} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bar Chart - Leads por Especialidade */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Leads por Especialidade (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            {espLoading ? (
              <Skeleton className="h-52" />
            ) : espData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                Sem dados de especialidade
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={espData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#A0A0A0', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#A0A0A0', fontSize: 11 }}
                    width={120}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]} animationDuration={1200}>
                    {espData.map((_, index) => (
                      <Cell key={`esp-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bar Chart - Leads por Região (DDD) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Leads por Região (DDD)</CardTitle>
          </CardHeader>
          <CardContent>
            {dddLoading ? (
              <Skeleton className="h-52" />
            ) : dddData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                Sem dados de DDD
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dddData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#A0A0A0', fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    height={60}
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
                    {dddData.map((_, index) => (
                      <Cell key={`ddd-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bar Chart - Faturamento Mensal */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.43 }} className="lg:col-span-2">
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Faturamento Mensal (Fechados)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-52" />
            ) : revenueData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                Nenhum valor de fechamento registrado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis dataKey="month" tick={{ fill: '#A0A0A0', fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: '#A0A0A0', fontSize: 11 }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        notation: 'compact',
                        maximumSignificantDigits: 3,
                      }).format(v)
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                          <p className="text-xs text-muted-foreground">{payload[0].payload.month}</p>
                          <p className="text-sm font-bold text-fyre">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value as number)}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="valor" name="Faturamento" fill="#C0DB52" radius={[4, 4, 0, 0]} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Line Chart - Evolução Diária */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="lg:col-span-2">
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Evolução de Contatos (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyLoading ? (
              <Skeleton className="h-52" />
            ) : dailyData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                Nenhum contato registrado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis dataKey="date" tick={{ fill: '#A0A0A0', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#A0A0A0', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="contatos"
                    name="Contatos"
                    stroke="#5026D3"
                    strokeWidth={2}
                    dot={{ fill: '#5026D3', r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
