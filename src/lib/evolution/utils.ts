import type { Lead } from '@/types'

export function formatPhoneForWhatsApp(
  ddd: string | null,
  telefone: string | null
): string | null {
  if (!telefone) return null
  const digits = ((ddd || '') + telefone).replace(/\D/g, '')
  if (!digits) return null
  // Already has country code
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return `55${digits}`
}

export function jidToPhone(jid: string): string {
  return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@.*$/, '')
}

export function phoneToJid(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@s.whatsapp.net`
}

export function phoneToDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Remove country code 55
  const local = digits.startsWith('55') ? digits.slice(2) : digits
  if (local.length >= 10) {
    const ddd = local.slice(0, 2)
    const num = local.slice(2)
    return `(${ddd}) ${num}`
  }
  return local
}

export function matchLeadByPhone(
  jid: string,
  leads: Lead[]
): Lead | null {
  const phone = jidToPhone(jid)
  // phone is like "5511999999999"
  const phoneDigits = phone.replace(/^55/, '')
  return (
    leads.find((lead) => {
      const leadPhone = ((lead.ddd || '') + (lead.telefone || '')).replace(
        /\D/g,
        ''
      )
      return leadPhone && phoneDigits.endsWith(leadPhone)
    }) || null
  )
}
