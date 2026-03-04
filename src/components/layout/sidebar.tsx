'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Upload,
  Kanban,
  User,
  Calendar,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  MessageSquareMore,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/reunioes', label: 'Reuniões', icon: Calendar },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/scripts', label: 'Scripts', icon: ScrollText },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/profile', label: 'Perfil', icon: User },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobile?: boolean
}

export function Sidebar({ collapsed, onToggle, mobile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <motion.aside
      animate={{ width: mobile ? 256 : collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'z-40 flex h-screen flex-col border-r border-border bg-sidebar',
        !mobile && 'fixed left-0 top-0'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary">
          <MessageSquareMore className="h-5 w-5 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {(!collapsed || mobile) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <h1 className="whitespace-nowrap text-lg font-bold tracking-tight">
                Prospecta<span className="text-fyre">Fyre</span>
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          const isCollapsed = collapsed && !mobile

          const link = (
            <Link
              key={item.href}
              href={item.href}
              onClick={mobile ? onToggle : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId={mobile ? 'sidebar-active-mobile' : 'sidebar-active'}
                  className="absolute left-0 h-8 w-1 rounded-r-full bg-primary"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )

          if (isCollapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          }

          return <div key={item.href}>{link}</div>
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!mobile && (
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={onToggle}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </motion.aside>
  )
}
