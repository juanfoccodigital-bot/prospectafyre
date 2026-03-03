'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Filter, X } from 'lucide-react'
import { useUsers } from '@/hooks/use-user'
import type { LeadFilters as LeadFiltersType, LeadStatus } from '@/types'
import { LEAD_STATUS_CONFIG } from '@/types'
import { ESTADOS_BRASIL } from '@/lib/constants'

interface LeadFiltersProps {
  filters: LeadFiltersType
  onChange: (filters: LeadFiltersType) => void
}

export function LeadFilters({ filters, onChange }: LeadFiltersProps) {
  const { users } = useUsers()
  const [showFilters, setShowFilters] = useState(false)

  const updateFilter = (key: keyof LeadFiltersType, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined })
  }

  const clearFilters = () => {
    onChange({})
  }

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '')

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="h-10 bg-card/80 pl-10"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} className="gap-2 text-destructive">
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {showFilters && (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">DDD</label>
              <Input
                placeholder="DDD"
                value={filters.ddd || ''}
                onChange={(e) => updateFilter('ddd', e.target.value)}
                className="h-9 bg-background/50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Cidade</label>
              <Input
                placeholder="Cidade"
                value={filters.cidade || ''}
                onChange={(e) => updateFilter('cidade', e.target.value)}
                className="h-9 bg-background/50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Estado</label>
              <Select
                value={filters.estado || ''}
                onValueChange={(v) => updateFilter('estado', v === 'all' ? undefined : v)}
              >
                <SelectTrigger className="h-9 bg-background/50">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {ESTADOS_BRASIL.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Especialidade</label>
              <Input
                placeholder="Especialidade"
                value={filters.especialidade || ''}
                onChange={(e) => updateFilter('especialidade', e.target.value)}
                className="h-9 bg-background/50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Status</label>
              <Select
                value={filters.status || ''}
                onValueChange={(v) => updateFilter('status', v === 'all' ? undefined : v)}
              >
                <SelectTrigger className="h-9 bg-background/50">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.emoji} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Responsável</label>
              <Select
                value={filters.assigned_to || ''}
                onValueChange={(v) => updateFilter('assigned_to', v === 'all' ? undefined : v)}
              >
                <SelectTrigger className="h-9 bg-background/50">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Faturamento (min)</label>
              <Input
                type="number"
                placeholder="Min"
                value={filters.faturamento_min || ''}
                onChange={(e) => updateFilter('faturamento_min', e.target.value ? Number(e.target.value) : undefined)}
                className="h-9 bg-background/50"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
