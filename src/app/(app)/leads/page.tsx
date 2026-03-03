'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeadsTable } from '@/components/leads/leads-table'
import { LeadFilters } from '@/components/leads/lead-filters'
import { LeadModal } from '@/components/leads/lead-modal'
import { useLeads } from '@/hooks/use-leads'
import type { LeadFilters as LeadFiltersType, Lead } from '@/types'
import { toast } from 'sonner'

export default function LeadsPage() {
  const [filters, setFilters] = useState<LeadFiltersType>({})
  const [page, setPage] = useState(1)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const { leads, total, loading, refetch, deleteLead, archiveLead } = useLeads(
    { ...filters, archived: showArchived },
    page
  )

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

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`Deletar o lead "${lead.nome}"? Esta ação não pode ser desfeita.`)) return
    const ok = await deleteLead(lead.id)
    if (ok) toast.success('Lead deletado')
    else toast.error('Erro ao deletar lead')
  }

  const handleArchive = async (lead: Lead) => {
    const newArchived = !lead.archived
    const ok = await archiveLead(lead.id, newArchived)
    if (ok) toast.success(newArchived ? 'Lead arquivado' : 'Lead desarquivado')
    else toast.error('Erro ao arquivar lead')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {showArchived ? 'Leads Arquivados' : 'Leads'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {showArchived
              ? 'Leads que foram arquivados'
              : 'Gerencie todos os seus leads de prospecção'}
          </p>
        </div>
        <Button
          variant={showArchived ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => {
            setShowArchived(!showArchived)
            setPage(1)
          }}
        >
          <Archive className="h-4 w-4" />
          {showArchived ? 'Ver Ativos' : 'Ver Arquivados'}
        </Button>
      </div>

      <LeadFilters filters={filters} onChange={setFilters} />

      <LeadsTable
        leads={leads}
        total={total}
        page={page}
        loading={loading}
        showArchived={showArchived}
        onPageChange={setPage}
        onEdit={handleEditLead}
        onDelete={handleDelete}
        onArchive={handleArchive}
      />

      <LeadModal
        lead={selectedLead}
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={async (lead) => {
          await handleDelete(lead)
          handleCloseModal()
        }}
      />
    </motion.div>
  )
}
