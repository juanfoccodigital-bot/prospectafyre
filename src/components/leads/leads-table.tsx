'use client'

import { motion } from 'framer-motion'
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
import { Edit, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Lead } from '@/types'
import { LEAD_STATUS_CONFIG } from '@/types'
import { LEADS_PER_PAGE } from '@/lib/constants'

interface LeadsTableProps {
  leads: Lead[]
  total: number
  page: number
  loading: boolean
  onPageChange: (page: number) => void
  onEdit: (lead: Lead) => void
}

export function LeadsTable({ leads, total, page, loading, onPageChange, onEdit }: LeadsTableProps) {
  const totalPages = Math.ceil(total / LEADS_PER_PAGE)

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

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
              <TableHead className="text-xs">Nome</TableHead>
              <TableHead className="text-xs">Telefone</TableHead>
              <TableHead className="text-xs">Cidade/UF</TableHead>
              <TableHead className="text-xs">DDD</TableHead>
              <TableHead className="text-xs">Especialidade</TableHead>
              <TableHead className="text-xs">Faturamento</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Responsável</TableHead>
              <TableHead className="text-xs">Resposta</TableHead>
              <TableHead className="text-xs w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                  Nenhum lead encontrado
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead, index) => {
                const statusConfig = LEAD_STATUS_CONFIG[lead.status]
                return (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-border/30 transition-colors hover:bg-accent/50 cursor-pointer"
                    onClick={() => onEdit(lead)}
                  >
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.telefone || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.cidade ? `${lead.cidade}/${lead.estado}` : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{lead.ddd || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.especialidade || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.faturamento
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.faturamento)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="whitespace-nowrap text-xs"
                        style={{
                          borderColor: `${statusConfig.color}40`,
                          backgroundColor: `${statusConfig.color}15`,
                          color: statusConfig.color,
                        }}
                      >
                        {statusConfig.emoji} {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.assigned_user?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {lead.resposta ? (
                        <Badge className="bg-fyre/10 text-fyre text-xs">Sim</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(lead)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} leads encontrados - Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
