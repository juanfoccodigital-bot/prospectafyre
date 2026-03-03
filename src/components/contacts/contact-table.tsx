'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit, MessageSquare, Trash2, UserPlus } from 'lucide-react'
import type { WhatsAppContact } from '@/types'
import { LEAD_STATUS_CONFIG } from '@/types'
import { jidToPhone, phoneToDisplay } from '@/lib/evolution/utils'

interface ContactTableProps {
  contacts: WhatsAppContact[]
  loading: boolean
  onEdit: (contact: WhatsAppContact) => void
  onDelete: (contact: WhatsAppContact) => void
  onConvert: (contact: WhatsAppContact) => void
}

export function ContactTable({ contacts, loading, onEdit, onDelete, onConvert }: ContactTableProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-border/50 bg-card/80">
        <p className="text-sm text-muted-foreground">Nenhum contato encontrado</p>
      </div>
    )
  }

  const getDisplayName = (c: WhatsAppContact) => c.nome || c.push_name || phoneToDisplay(jidToPhone(c.remote_jid))
  const getPhone = (c: WhatsAppContact) => phoneToDisplay(jidToPhone(c.remote_jid))
  const getInitial = (c: WhatsAppContact) => getDisplayName(c).charAt(0).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="rounded-2xl border border-border/50 bg-card/80">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-xs">Contato</TableHead>
              <TableHead className="text-xs">Telefone</TableHead>
              <TableHead className="text-xs">Tags</TableHead>
              <TableHead className="text-xs">Lead Vinculado</TableHead>
              <TableHead className="text-xs">Origem</TableHead>
              <TableHead className="text-xs text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.remote_jid} className="border-border/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {contact.profile_pic_url ? (
                      <img
                        src={contact.profile_pic_url}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        {getInitial(contact)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{getDisplayName(contact)}</p>
                      {contact.push_name && contact.nome && contact.push_name !== contact.nome && (
                        <p className="text-[11px] text-muted-foreground">{contact.push_name}</p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {getPhone(contact)}
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>

                <TableCell>
                  {contact.lead ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{contact.lead.nome}</span>
                      <Badge
                        variant="outline"
                        className="text-[9px]"
                        style={{
                          borderColor: `${LEAD_STATUS_CONFIG[contact.lead.status]?.color}40`,
                          color: LEAD_STATUS_CONFIG[contact.lead.status]?.color,
                        }}
                      >
                        {LEAD_STATUS_CONFIG[contact.lead.status]?.label}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {contact.created_manually ? 'Manual' : 'WhatsApp'}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      title="Enviar mensagem"
                      onClick={() => {
                        const phone = jidToPhone(contact.remote_jid)
                        router.push(`/atendimento?phone=${phone}`)
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                    {!contact.lead && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-[var(--fyre)] hover:text-[var(--fyre)]"
                        title="Converter em Lead"
                        onClick={() => onConvert(contact)}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      title="Editar"
                      onClick={() => onEdit(contact)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      title="Deletar"
                      onClick={() => onDelete(contact)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}
