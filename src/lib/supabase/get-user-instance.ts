import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolve the instance_name for the currently authenticated user.
 * Returns null if no user is logged in or no instance exists.
 */
export async function getUserInstance(supabase: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('whatsapp_instances')
    .select('instance_name')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.instance_name || null
}
