'use client'

import { motion } from 'framer-motion'
import { LeadUpload } from '@/components/leads/lead-upload'

export default function UploadPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload de Leads</h1>
        <p className="text-sm text-muted-foreground">
          Importe leads via planilha CSV ou XLSX
        </p>
      </div>

      <LeadUpload />
    </motion.div>
  )
}
