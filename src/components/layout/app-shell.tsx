'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="dark flex min-h-screen bg-background">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 border-border bg-sidebar p-0">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} mobile />
          </SheetContent>
        </Sheet>

        <motion.div
          animate={{ paddingLeft: collapsed ? 72 : 256 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex min-w-0 flex-1 flex-col pl-0 lg:pl-64"
        >
          <Topbar
            mobileMenuButton={
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            }
          />
          <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}
