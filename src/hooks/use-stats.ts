'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchAllRows } from '@/lib/supabase/fetch-all'
import type { DashboardStats, UserScore, User, DateRange } from '@/types'
import { POINTS } from '@/lib/constants'

const DDD_REGION: Record<string, string> = {
  '11': 'SP - Capital', '12': 'SP - Vale', '13': 'SP - Litoral', '14': 'SP - Bauru',
  '15': 'SP - Sorocaba', '16': 'SP - Ribeirão', '17': 'SP - S.J.Rio Preto', '18': 'SP - P.Prudente',
  '19': 'SP - Campinas', '21': 'RJ - Capital', '22': 'RJ - Interior', '24': 'RJ - Interior',
  '27': 'ES', '28': 'ES', '31': 'MG - BH', '32': 'MG - J.Fora',
  '33': 'MG - Gov.Valadares', '34': 'MG - Uberlândia', '35': 'MG - Poços', '37': 'MG - Divinópolis',
  '38': 'MG - Montes Claros', '41': 'PR - Curitiba', '42': 'PR - P.Grossa', '43': 'PR - Londrina',
  '44': 'PR - Maringá', '45': 'PR - Foz', '46': 'PR - F.Beltrão',
  '47': 'SC - Joinville', '48': 'SC - Florianópolis', '49': 'SC - Chapecó',
  '51': 'RS - POA', '53': 'RS - Pelotas', '54': 'RS - Caxias', '55': 'RS - S.Maria',
  '61': 'DF', '62': 'GO', '63': 'TO', '64': 'GO - Interior',
  '65': 'MT - Cuiabá', '66': 'MT - Rondonópolis', '67': 'MS',
  '68': 'AC', '69': 'RO',
  '71': 'BA - Salvador', '73': 'BA - Itabuna', '74': 'BA - Juazeiro', '75': 'BA - Feira',
  '77': 'BA - V.Conquista', '79': 'SE',
  '81': 'PE - Recife', '82': 'AL', '83': 'PB', '84': 'RN', '85': 'CE - Fortaleza',
  '86': 'PI', '87': 'PE - Interior', '88': 'CE - Interior', '89': 'PI - Interior',
  '91': 'PA - Belém', '92': 'AM', '93': 'PA - Santarém', '94': 'PA - Marabá',
  '95': 'RR', '96': 'AP', '97': 'AM - Interior', '98': 'MA - S.Luís', '99': 'MA - Interior',
}

export function getDddRegion(ddd: string): string {
  return DDD_REGION[ddd] || `DDD ${ddd}`
}

function buildDateFilters(dateRange?: DateRange) {
  const filters: { gte?: [string, string][]; lte?: [string, string][] } = {}
  if (dateRange?.from) filters.gte = [['created_at', dateRange.from]]
  if (dateRange?.to) filters.lte = [['created_at', dateRange.to + 'T23:59:59.999Z']]
  return filters
}

export function useDashboardStats(dateRange?: DateRange) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const rangeKey = JSON.stringify(dateRange)

  const fetchStats = useCallback(async () => {
    setLoading(true)

    const leads = await fetchAllRows<{ status: string; assigned_to: string; resposta: boolean; valor_fechamento: number | null }>(
      supabase, 'leads', 'status, assigned_to, resposta, valor_fechamento', buildDateFilters(dateRange)
    )

    const totalLeads = leads.length
    const leadsPorUsuario: Record<string, number> = {}
    let leadsContatados = 0
    let leadsFechados = 0
    let leadsPerdidos = 0
    let respostas = 0
    let faturamentoFechado = 0

    leads.forEach((lead) => {
      leadsPorUsuario[lead.assigned_to] = (leadsPorUsuario[lead.assigned_to] || 0) + 1
      if (lead.status !== 'novo') leadsContatados++
      if (lead.status === 'fechado') {
        leadsFechados++
        if (lead.valor_fechamento) faturamentoFechado += lead.valor_fechamento
      }
      if (lead.status === 'perdido') leadsPerdidos++
      if (lead.resposta) respostas++
    })

    const churnBase = leadsFechados + leadsPerdidos
    setStats({
      totalLeads,
      leadsPorUsuario,
      leadsContatados,
      leadsFechados,
      leadsPerdidos,
      taxaConversao: totalLeads > 0 ? (leadsFechados / totalLeads) * 100 : 0,
      taxaResposta: totalLeads > 0 ? (respostas / totalLeads) * 100 : 0,
      faturamentoFechado,
      taxaChurn: churnBase > 0 ? (leadsPerdidos / churnBase) * 100 : 0,
    })
    setLoading(false)
  }, [rangeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, refetch: fetchStats }
}

export function useRanking(dateRange?: DateRange) {
  const [ranking, setRanking] = useState<UserScore[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const rangeKey = JSON.stringify(dateRange)

  const fetchRanking = useCallback(async () => {
    setLoading(true)

    const { data: users } = await supabase.from('users').select('*')
    const leads = await fetchAllRows<{ status: string; assigned_to: string }>(
      supabase, 'leads', 'status, assigned_to', buildDateFilters(dateRange)
    )

    if (users) {
      const scores: UserScore[] = users.map((user: User) => {
        const userLeads = leads.filter((l) => l.assigned_to === user.id)
        const contatos = userLeads.filter((l) => l.status !== 'novo').length
        const propostas = userLeads.filter((l) => l.status === 'proposta_enviada' || l.status === 'fechado').length
        const fechados = userLeads.filter((l) => l.status === 'fechado').length

        return {
          userId: user.id,
          userName: user.name,
          avatarUrl: user.avatar_url,
          contatos,
          propostas,
          fechados,
          pontuacao: contatos * POINTS.CONTATO + propostas * POINTS.PROPOSTA + fechados * POINTS.FECHADO,
        }
      })

      scores.sort((a, b) => b.pontuacao - a.pontuacao)
      setRanking(scores)
    }
    setLoading(false)
  }, [rangeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRanking()
  }, [fetchRanking])

  return { ranking, loading, refetch: fetchRanking }
}

export function useLeadStatusChart(dateRange?: DateRange) {
  const [data, setData] = useState<{ name: string; value: number; fill: string }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const rangeKey = JSON.stringify(dateRange)

  const fetchData = useCallback(async () => {
    setLoading(true)

    const leads = await fetchAllRows<{ status: string }>(
      supabase, 'leads', 'status', buildDateFilters(dateRange)
    )

    const statusMap: Record<string, { count: number; label: string; color: string }> = {
      novo: { count: 0, label: 'Novo Lead', color: '#FF6B6B' },
      tentando_contato: { count: 0, label: 'Tentando Contato', color: '#FFA726' },
      em_conversa: { count: 0, label: 'Em Conversa', color: '#42A5F5' },
      proposta_enviada: { count: 0, label: 'Proposta Enviada', color: '#7C4DFF' },
      fechado: { count: 0, label: 'Fechado', color: '#C0DB52' },
      perdido: { count: 0, label: 'Perdido', color: '#EF5350' },
    }

    leads.forEach((l) => {
      if (statusMap[l.status]) statusMap[l.status].count++
    })

    setData(
      Object.values(statusMap)
        .filter((s) => s.count > 0)
        .map((s) => ({ name: s.label, value: s.count, fill: s.color }))
    )
    setLoading(false)
  }, [rangeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading }
}

export function useDailyContactsChart(dateRange?: DateRange) {
  const [data, setData] = useState<{ date: string; contatos: number }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const rangeKey = JSON.stringify(dateRange)

  const fetchData = useCallback(async () => {
    setLoading(true)

    const fromDate = dateRange?.from || (() => {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return d.toISOString().split('T')[0]
    })()

    const filters: { gte: [string, string][]; lte?: [string, string][] } = {
      gte: [['created_at', fromDate]],
    }
    if (dateRange?.to) filters.lte = [['created_at', dateRange.to + 'T23:59:59.999Z']]

    const interactions = await fetchAllRows<{ created_at: string }>(
      supabase, 'interactions', 'created_at', filters,
      { column: 'created_at', ascending: true }
    )

    const grouped: Record<string, number> = {}
    interactions.forEach((i) => {
      const date = new Date(i.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      grouped[date] = (grouped[date] || 0) + 1
    })
    setData(Object.entries(grouped).map(([date, contatos]) => ({ date, contatos })))
    setLoading(false)
  }, [rangeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading }
}

export function useLeadsByEspecialidade(dateRange?: DateRange) {
  const [data, setData] = useState<{ name: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const rangeKey = JSON.stringify(dateRange)

  const fetchData = useCallback(async () => {
    setLoading(true)

    const leads = await fetchAllRows<{ especialidade: string | null }>(
      supabase, 'leads', 'especialidade', buildDateFilters(dateRange)
    )

    const grouped: Record<string, number> = {}
    leads.forEach((l) => {
      const esp = l.especialidade?.trim() || 'Não informado'
      grouped[esp] = (grouped[esp] || 0) + 1
    })
    const sorted = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
    setData(sorted)
    setLoading(false)
  }, [rangeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading }
}

export function useLeadsByDDD(dateRange?: DateRange) {
  const [data, setData] = useState<{ name: string; ddd: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const rangeKey = JSON.stringify(dateRange)

  const fetchData = useCallback(async () => {
    setLoading(true)

    const leads = await fetchAllRows<{ ddd: string | null }>(
      supabase, 'leads', 'ddd', buildDateFilters(dateRange)
    )

    const grouped: Record<string, number> = {}
    leads.forEach((l) => {
      const ddd = l.ddd?.trim() || 'N/A'
      grouped[ddd] = (grouped[ddd] || 0) + 1
    })
    const sorted = Object.entries(grouped)
      .filter(([ddd]) => ddd !== 'N/A')
      .map(([ddd, value]) => ({ name: getDddRegion(ddd), ddd, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12)
    setData(sorted)
    setLoading(false)
  }, [rangeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading }
}

export function useRevenueChart(dateRange?: DateRange) {
  const [data, setData] = useState<{ month: string; valor: number }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const rangeKey = JSON.stringify(dateRange)

  const fetchData = useCallback(async () => {
    setLoading(true)

    const filters = buildDateFilters(dateRange)
    const leads = await fetchAllRows<{ status: string; valor_fechamento: number | null; updated_at: string }>(
      supabase, 'leads', 'status, valor_fechamento, updated_at',
      { ...filters, eq: [['status', 'fechado']] }
    )

    const grouped: Record<string, number> = {}
    leads.forEach((l) => {
      if (!l.valor_fechamento) return
      const d = new Date(l.updated_at)
      const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      grouped[key] = (grouped[key] || 0) + l.valor_fechamento
    })

    const sorted = Object.entries(grouped)
      .map(([month, valor]) => ({ month, valor }))
      .slice(-6)

    setData(sorted)
    setLoading(false)
  }, [rangeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading }
}
