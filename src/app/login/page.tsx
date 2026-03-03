'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageSquareMore, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="dark relative flex min-h-screen bg-[#060606]">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Main glow */}
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/4 translate-y-1/4 rounded-full bg-fyre/8 blur-[120px]" />
        <div className="absolute bottom-1/3 left-0 h-[300px] w-[300px] -translate-x-1/3 rounded-full bg-primary/10 blur-[100px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating orbs */}
        <motion.div
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[15%] top-[20%] h-2 w-2 rounded-full bg-primary/40"
        />
        <motion.div
          animate={{ y: [15, -15, 15], x: [10, -10, 10] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute right-[20%] top-[30%] h-1.5 w-1.5 rounded-full bg-fyre/50"
        />
        <motion.div
          animate={{ y: [-10, 20, -10] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute left-[30%] bottom-[25%] h-1 w-1 rounded-full bg-primary/30"
        />
        <motion.div
          animate={{ y: [10, -20, 10], x: [-5, 15, -5] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute right-[35%] bottom-[35%] h-2.5 w-2.5 rounded-full bg-fyre/20"
        />
      </div>

      {/* Left side - Branding */}
      <div className="relative hidden flex-1 items-center justify-center lg:flex">
        <div className="relative z-10 max-w-lg px-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {/* Logo mark */}
            <div className="mb-10 flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-2xl shadow-primary/30"
              >
                <MessageSquareMore className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  Prospecta<span className="text-fyre">Fyre</span>
                </h1>
              </div>
            </div>

            <h2 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-white">
              Gerencie seus leads com{' '}
              <span className="bg-gradient-to-r from-primary to-fyre bg-clip-text text-transparent">
                inteligência
              </span>
            </h2>

            <p className="mb-10 text-lg leading-relaxed text-white/50">
              CRM profissional de prospecção. Distribua, acompanhe e converta leads
              com um sistema gamificado e visual moderno.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {['Kanban Interativo', 'Dashboard Analítico', 'Ranking Gamificado', 'Upload Automático'].map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 backdrop-blur-sm"
                >
                  {feature}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-16 h-px origin-left bg-gradient-to-r from-primary/50 via-fyre/30 to-transparent"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6 text-xs text-white/20"
          >
            Feito para quem leva prospecção a sério.
          </motion.p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="relative flex flex-1 items-center justify-center px-6 lg:max-w-[520px]">
        {/* Subtle border on left */}
        <div className="absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-[380px]"
        >
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20"
            >
              <MessageSquareMore className="h-5 w-5 text-white" />
            </motion.div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Prospecta<span className="text-fyre">Fyre</span>
            </h1>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white">Bem-vindo de volta</h3>
            <p className="mt-2 text-sm text-white/40">
              Entre com suas credenciais para acessar o painel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white/70">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12 rounded-xl border-white/10 bg-white/5 px-4 text-white placeholder:text-white/25 focus:border-primary/50 focus:bg-white/[0.07] focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white/70">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-white/10 bg-white/5 px-4 pr-11 text-white placeholder:text-white/25 focus:border-primary/50 focus:bg-white/[0.07] focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3"
              >
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="group h-12 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Entrar no painel
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-10 border-t border-white/5 pt-6">
            <p className="text-center text-xs text-white/20">
              ProspectaFyre v1.0 — CRM de Prospecção
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
