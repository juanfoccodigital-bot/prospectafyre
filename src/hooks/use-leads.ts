'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchAllRows } from '@/lib/supabase/fetch-all'
import type { Lead, LeadFilters, LeadStatus, Interaction, DateRange } from '@/types'
import { LEADS_PER_PAGE } from '@/lib/constants'

export function useLeads(filters: LeadFilters = {}, page = 1) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const filtersKey = JSON.stringify(filters)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('leads')
      .select('*, assigned_user:users!assigned_to(*)', { count: 'exact' })

    if (filters.search) {
      query = query.or(`nome.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`)
    }
    if (filters.ddd) query = query.eq('ddd', filters.ddd)
    if (filters.cidade) query = query.ilike('cidade', `%${filters.cidade}%`)
    if (filters.estado) query = query.eq('estado', filters.estado)
    if (filters.especialidade) query = query.ilike('especialidade', `%${filters.especialidade}%`)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
    if (filters.faturamento_min != null) query = query.gte('faturamento', filters.faturamento_min)
    if (filters.faturamento_max != null) query = query.lte('faturamento', filters.faturamento_max)
    if (filters.archived) {
      query = query.eq('archived', true)
    } else {
      query = query.or('archived.is.null,archived.eq.false')
    }

    const from = (page - 1) * LEADS_PER_PAGE
    const to = from + LEADS_PER_PAGE - 1

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!error) {
      setLeads(data || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }, [filtersKey, page]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const deleteLead = useCallback(async (leadId: string) => {
    // Delete interactions first
    await supabase.from('interactions').delete().eq('lead_id', leadId)
    const { error } = await supabase.from('leads').delete().eq('id', leadId)
    if (!error) await fetchLeads()
    return !error
  }, [fetchLeads]) // eslint-disable-line react-hooks/exhaustive-deps

  const archiveLead = useCallback(async (leadId: string, archived: boolean) => {
    const { error } = await supabase
      .from('leads')
      .update({ archived })
      .eq('id', leadId)
    if (!error) await fetchLeads()
    return !error
  }, [fetchLeads]) // eslint-disable-line react-hooks/exhaustive-deps

  return { leads, total, loading, refetch: fetchLeads, deleteLead, archiveLead }
}

export function useLeadsByStatus(userId?: string, dateRange?: DateRange) {
  const [leadsByStatus, setLeadsByStatus] = useState<Record<LeadStatus, Lead[]>>({
    novo: [],
    tentando_contato: [],
    em_conversa: [],
    proposta_enviada: [],
    fechado: [],
    perdido: [],
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const rangeKey = JSON.stringify(dateRange)

  const fetchLeads = useCallback(async () => {
    setLoading(true)

    const filters: { eq?: [string, string][]; gte?: [string, string][]; lte?: [string, string][] } = {}
    if (userId) filters.eq = [['assigned_to', userId]]
    if (dateRange?.from) filters.gte = [['created_at', dateRange.from]]
    if (dateRange?.to) filters.lte = [['created_at', dateRange.to + 'T23:59:59.999Z']]

    const data = await fetchAllRows<Lead>(
      supabase, 'leads', '*', filters,
      { column: 'created_at', ascending: false }
    )

    const grouped: Record<LeadStatus, Lead[]> = {
      novo: [],
      tentando_contato: [],
      em_conversa: [],
      proposta_enviada: [],
      fechado: [],
      perdido: [],
    }

    data.forEach((lead) => {
      const status = lead.status as LeadStatus
      if (grouped[status]) {
        grouped[status].push(lead)
      }
    })

    setLeadsByStatus(grouped)
    setLoading(false)
  }, [userId, rangeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  return { leadsByStatus, loading, refetch: fetchLeads }
}

export function useInteractions(leadId: string) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchInteractions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('interactions')
      .select('*, user:users!user_id(*)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    setInteractions(data || [])
    setLoading(false)
  }, [leadId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchInteractions()
  }, [fetchInteractions])

  return { interactions, loading, refetch: fetchInteractions }
}
