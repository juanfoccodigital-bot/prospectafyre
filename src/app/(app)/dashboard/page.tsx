'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { DashboardCharts } from '@/components/dashboard/charts'
import { Ranking } from '@/components/dashboard/ranking'
import { DateFilter } from '@/components/shared/date-filter'
import type { DateRange } from '@/types'

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral da sua prospecção
          </p>
        </div>
        <DateFilter dateRange={dateRange} onChange={setDateRange} />
      </div>

      <StatsCards dateRange={dateRange} />
      <DashboardCharts dateRange={dateRange} />
      <Ranking dateRange={dateRange} />
    </motion.div>
  )
}
