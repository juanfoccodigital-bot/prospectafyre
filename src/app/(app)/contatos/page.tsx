'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ContactTable } from '@/components/contacts/contact-table'
import { ContactModal } from '@/components/contacts/contact-modal'
import { ConvertToLeadModal } from '@/components/contacts/convert-to-lead-modal'
import { useContacts } from '@/hooks/use-contacts'
import type { WhatsAppContact } from '@/types'
import { jidToPhone, phoneToDisplay } from '@/lib/evolution/utils'
import { toast } from 'sonner'

export default function ContatosPage() {
  const { contacts, loading, refetch, createContact, updateContact, deleteContact, archiveContact } = useContacts()
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [convertContact, setConvertContact] = useState<WhatsAppContact | null>(null)
  const [convertOpen, setConvertOpen] = useState(false)

  const filtered = useMemo(() => {
    let list = contacts.filter((c) => showArchived ? c.archived : !c.archived)
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter((c) => {
      const name = (c.nome || c.push_name || '').toLowerCase()
      const phone = phoneToDisplay(jidToPhone(c.remote_jid)).toLowerCase()
      const rawPhone = jidToPhone(c.remote_jid)
      const tags = (c.tags || []).join(' ').toLowerCase()
      return name.includes(q) || phone.includes(q) || rawPhone.includes(q) || tags.includes(q)
    })
  }, [contacts, search, showArchived])

  const handleNew = () => {
    setSelectedContact(null)
    setModalOpen(true)
  }

  const handleEdit = (contact: WhatsAppContact) => {
    setSelectedContact(contact)
    setModalOpen(true)
  }

  const handleDelete = async (contact: WhatsAppContact) => {
    const name = contact.nome || contact.push_name || phoneToDisplay(jidToPhone(contact.remote_jid))
    if (!confirm(`Deletar o contato "${name}"?`)) return
    await deleteContact(contact.remote_jid)
  }

  const handleArchive = async (contact: WhatsAppContact) => {
    const newArchived = !contact.archived
    const ok = await archiveContact(contact.remote_jid, newArchived)
    if (ok) toast.success(newArchived ? 'Contato arquivado' : 'Contato desarquivado')
    else toast.error('Erro ao arquivar contato')
  }

  const handleConvert = (contact: WhatsAppContact) => {
    setConvertContact(contact)
    setConvertOpen(true)
  }

  const handleSave = async (data: { phone?: string; nome?: string; observacoes?: string }) => {
    if (selectedContact) {
      return updateContact(selectedContact.remote_jid, {
        nome: data.nome,
        observacoes: data.observacoes,
      })
    }
    return createContact(data.phone!, data.nome)
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
            {showArchived ? 'Contatos Arquivados' : 'Contatos'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {showArchived
              ? 'Contatos que foram arquivados'
              : 'Gerencie seus contatos do WhatsApp'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-4 w-4" />
            {showArchived ? 'Ver Ativos' : 'Ver Arquivados'}
          </Button>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <ContactTable
        contacts={filtered}
        loading={loading}
        showArchived={showArchived}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onConvert={handleConvert}
      />

      <ContactModal
        contact={selectedContact}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedContact(null)
        }}
        onSave={handleSave}
      />

      <ConvertToLeadModal
        contact={convertContact}
        open={convertOpen}
        onClose={() => {
          setConvertOpen(false)
          setConvertContact(null)
        }}
        onConverted={refetch}
      />
    </motion.div>
  )
}
