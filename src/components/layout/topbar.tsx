'use client'

import { useRouter } from 'next/navigation'
import { Bell, LogOut, Trophy } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { ConnectionStatusBadge } from '@/components/whatsapp/connection-status-badge'

interface TopbarProps {
  mobileMenuButton?: React.ReactNode
}

export function Topbar({ mobileMenuButton }: TopbarProps) {
  const { user } = useUser()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        {mobileMenuButton}
        <h2 className="text-sm font-medium text-muted-foreground">
          Bem-vindo de volta,{' '}
          <span className="text-foreground">{user?.name || 'Carregando...'}</span>
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Ranking badge */}
        <Badge variant="outline" className="gap-1.5 border-fyre/30 bg-fyre/10 text-fyre px-3 py-1">
          <Trophy className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">Admin</span>
        </Badge>

        {/* WhatsApp status */}
        <ConnectionStatusBadge compact />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3">
              <Avatar className="h-8 w-8 border border-border">
                {user?.avatar_url && (
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                )}
                <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
