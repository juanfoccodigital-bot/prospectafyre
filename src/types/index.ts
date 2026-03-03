export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export type LeadStatus =
  | 'novo'
  | 'tentando_contato'
  | 'em_conversa'
  | 'proposta_enviada'
  | 'fechado'
  | 'perdido'

export interface Lead {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  cidade: string | null
  estado: string | null
  ddd: string | null
  especialidade: string | null
  faturamento: number | null
  valor_fechamento: number | null
  status: LeadStatus
  assigned_to: string
  observacoes: string | null
  ultimo_contato: string | null
  resposta: boolean
  archived: boolean
  created_at: string
  updated_at: string
  // joined
  assigned_user?: User
}

export type InteractionType = 'ligacao' | 'whatsapp' | 'email' | 'outro'

export interface Interaction {
  id: string
  lead_id: string
  user_id: string
  tipo: InteractionType
  descricao: string | null
  created_at: string
  // joined
  user?: User
}

export interface LeadFilters {
  search?: string
  ddd?: string
  cidade?: string
  estado?: string
  especialidade?: string
  faturamento_min?: number
  faturamento_max?: number
  status?: LeadStatus
  assigned_to?: string
  archived?: boolean
}

export interface DashboardStats {
  totalLeads: number
  leadsPorUsuario: Record<string, number>
  leadsContatados: number
  leadsFechados: number
  leadsPerdidos: number
  taxaConversao: number
  taxaResposta: number
  faturamentoFechado: number
  taxaChurn: number
}

export interface UserScore {
  userId: string
  userName: string
  avatarUrl: string | null
  contatos: number
  propostas: number
  fechados: number
  pontuacao: number
}

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; emoji: string; color: string }> = {
  novo: { label: 'Novo Lead', emoji: '🔥', color: '#FF6B6B' },
  tentando_contato: { label: 'Tentando Contato', emoji: '📞', color: '#FFA726' },
  em_conversa: { label: 'Em Conversa', emoji: '💬', color: '#42A5F5' },
  proposta_enviada: { label: 'Proposta Enviada', emoji: '📑', color: '#7C4DFF' },
  fechado: { label: 'Fechado', emoji: '🚀', color: '#C0DB52' },
  perdido: { label: 'Perdido', emoji: '❌', color: '#EF5350' },
}

export const KANBAN_COLUMNS: LeadStatus[] = [
  'novo',
  'tentando_contato',
  'em_conversa',
  'proposta_enviada',
  'fechado',
  'perdido',
]

export type PeriodPreset = 'today' | '7d' | '30d' | 'all' | 'custom'

export interface DateRange {
  from: string | null
  to: string | null
}

// WhatsApp Integration

export interface WhatsAppInstance {
  id: string
  instance_name: string
  instance_id: string | null
  status: 'disconnected' | 'connecting' | 'connected'
  owner_phone: string | null
  webhook_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type MessageDirection = 'inbound' | 'outbound'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'
export type MediaType = 'image' | 'video' | 'audio' | 'document'

export interface WhatsAppMessage {
  id: string
  instance_name: string
  remote_jid: string
  message_id: string | null
  direction: MessageDirection
  content: string | null
  media_type: MediaType | null
  media_url: string | null
  media_mime_type: string | null
  file_name: string | null
  status: MessageStatus
  lead_id: string | null
  created_at: string
  lead?: Lead
}

export interface Conversation {
  remote_jid: string
  phone: string
  contact_name: string | null
  profile_pic_url: string | null
  last_message: string | null
  last_message_at: string
  unread_count: number
  lead?: Lead | null
  tags: string[]
}

export interface WhatsAppTemplate {
  id: string
  name: string
  content: string
  category: string
  created_by: string | null
  created_at: string
}

export interface ContactTag {
  id: string
  remote_jid: string
  tag: string
  created_at: string
}

export interface WhatsAppContact {
  remote_jid: string
  push_name: string | null
  nome: string | null
  profile_pic_url: string | null
  observacoes: string | null
  archived: boolean
  created_manually: boolean
  updated_at: string
  tags?: string[]
  lead?: Lead | null
}

// Meetings

export type MeetingStatus = 'agendada' | 'realizada' | 'cancelada'

export interface Meeting {
  id: string
  titulo: string
  descricao: string | null
  scheduled_at: string
  duration_min: number
  status: MeetingStatus
  lead_id: string | null
  contact_jid: string | null
  created_by: string
  created_at: string
  updated_at: string
  // joined
  lead?: Lead | null
  creator?: User | null
}
