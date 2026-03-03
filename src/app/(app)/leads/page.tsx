'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LeadsTable } from '@/components/leads/leads-table'
import { LeadFilters } from '@/components/leads/lead-filters'
import { LeadModal } from '@/components/leads/lead-modal'
import { useLeads } from '@/hooks/use-leads'
import type { LeadFilters as LeadFiltersType, Lead } from '@/types'

export default function LeadsPage() {
  const [filters, setFilters] = useState<LeadFiltersType>({})
  const [page, setPage] = useState(1)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { leads, total, loading, refetch } = useLeads(filters, page)

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedLead(null)
  }

  const handleSave = () => {
    handleCloseModal()
    refetch()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie todos os seus leads de prospecção
        </p>
      </div>

      <LeadFilters filters={filters} onChange={setFilters} />

      <LeadsTable
        leads={leads}
        total={total}
        page={page}
        loading={loading}
        onPageChange={setPage}
        onEdit={handleEditLead}
      />

      <LeadModal
        lead={selectedLead}
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </motion.div>
  )
}
