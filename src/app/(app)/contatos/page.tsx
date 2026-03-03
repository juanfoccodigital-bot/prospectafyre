'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ContactTable } from '@/components/contacts/contact-table'
import { ContactModal } from '@/components/contacts/contact-modal'
import { useContacts } from '@/hooks/use-contacts'
import type { WhatsAppContact } from '@/types'
import { jidToPhone, phoneToDisplay } from '@/lib/evolution/utils'

export default function ContatosPage() {
  const { contacts, loading, createContact, updateContact, deleteContact } = useContacts()
  const [search, setSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!search) return contacts
    const q = search.toLowerCase()
    return contacts.filter((c) => {
      const name = (c.nome || c.push_name || '').toLowerCase()
      const phone = phoneToDisplay(jidToPhone(c.remote_jid)).toLowerCase()
      const rawPhone = jidToPhone(c.remote_jid)
      const tags = (c.tags || []).join(' ').toLowerCase()
      return name.includes(q) || phone.includes(q) || rawPhone.includes(q) || tags.includes(q)
    })
  }, [contacts, search])

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
          <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus contatos do WhatsApp
          </p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Contato
        </Button>
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
        onEdit={handleEdit}
        onDelete={handleDelete}
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
    </motion.div>
  )
}
