'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      // Get auth user (try getUser, fallback to getSession)
      let authId: string | undefined
      let authEmail: string | undefined
      const { data: { user: authUser } } = await supabase.auth.getUser()
      authId = authUser?.id
      authEmail = authUser?.email

      if (!authId) {
        const { data: { session } } = await supabase.auth.getSession()
        authId = session?.user?.id
        authEmail = session?.user?.email
      }

      if (authId) {
        // Use maybeSingle to avoid 406 when row doesn't exist
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authId)
          .maybeSingle()

        if (data) {
          setUser(data)
        } else {
          // Auto-create profile from auth data
          const newUser = {
            id: authId,
            name: authEmail?.split('@')[0] || 'Usuário',
            email: authEmail || '',
            role: 'admin',
          }
          const { data: created } = await supabase
            .from('users')
            .upsert(newUser)
            .select()
            .single()
          setUser(created)
        }
      }
      setLoading(false)
    }
    getUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateUser = useCallback(async (updates: Partial<Pick<User, 'name' | 'avatar_url'>>) => {
    if (!user) return { error: 'Usuário não encontrado' }
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (!error && data) setUser(data)
    return { data, error: error?.message }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return { error: 'Usuário não encontrado' }
    const ext = file.name.split('.').pop()
    const filePath = `${user.id}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })
    if (uploadError) return { error: uploadError.message }
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    const result = await updateUser({ avatar_url: `${publicUrl}?t=${Date.now()}` })
    return result
  }, [user, updateUser]) // eslint-disable-line react-hooks/exhaustive-deps

  return { user, loading, updateUser, uploadAvatar }
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('name')
      setUsers(data || [])
      setLoading(false)
    }
    fetchUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { users, loading }
}
