'use client'

import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DateRange, PeriodPreset } from '@/types'

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getPresetRange(preset: PeriodPreset): DateRange {
  const today = new Date()
  switch (preset) {
    case 'today':
      return { from: toISODate(today), to: toISODate(today) }
    case '7d': {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      return { from: toISODate(d), to: toISODate(today) }
    }
    case '30d': {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return { from: toISODate(d), to: toISODate(today) }
    }
    default:
      return { from: null, to: null }
  }
}

interface DateFilterProps {
  dateRange: DateRange
  onChange: (range: DateRange) => void
}

export function DateFilter({ dateRange, onChange }: DateFilterProps) {
  const [preset, setPreset] = useState<PeriodPreset>('all')

  const handlePreset = (value: PeriodPreset) => {
    setPreset(value)
    if (value !== 'custom') {
      onChange(getPresetRange(value))
    }
  }

  return (
    <div className="flex items-center gap-3">
      <CalendarDays className="h-4 w-4 text-muted-foreground" />
      <Select value={preset} onValueChange={handlePreset}>
        <SelectTrigger className="h-9 w-44 bg-card/80 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="7d">Ultimos 7 dias</SelectItem>
          <SelectItem value="30d">Ultimos 30 dias</SelectItem>
          <SelectItem value="all">Todo periodo</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {preset === 'custom' && (
        <>
          <Input
            type="date"
            value={dateRange.from || ''}
            onChange={(e) => onChange({ ...dateRange, from: e.target.value || null })}
            className="h-9 w-38 bg-card/80 text-sm"
          />
          <span className="text-xs text-muted-foreground">ate</span>
          <Input
            type="date"
            value={dateRange.to || ''}
            onChange={(e) => onChange({ ...dateRange, to: e.target.value || null })}
            className="h-9 w-38 bg-card/80 text-sm"
          />
        </>
      )}
    </div>
  )
}
