'use client'

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

export default function ContatosPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-[calc(100vh-4rem)] items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card/80 px-12 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Em breve</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A gestão de contatos estará disponível em breve.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
