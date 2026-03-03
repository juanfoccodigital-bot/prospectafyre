const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''

const headers = {
  'Content-Type': 'application/json',
  apikey: EVOLUTION_API_KEY,
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${EVOLUTION_API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Evolution API ${res.status}: ${text}`)
  }
  return res.json()
}

export const evolutionApi = {
  // Instance management
  async createInstance(instanceName: string, webhookUrl: string) {
    return request('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
        webhook: {
          url: webhookUrl,
          events: [
            'QRCODE_UPDATED',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CONNECTION_UPDATE',
            'SEND_MESSAGE',
          ],
          webhook_by_events: false,
          webhook_base64: true,
        },
      }),
    })
  },

  async fetchInstances() {
    return request<unknown[]>('/instance/fetchInstances')
  },

  async getConnectionState(instanceName: string) {
    const data = await request<{ instance: { instanceName: string; state: string } }>(
      `/instance/connectionState/${instanceName}`
    )
    // Normalize: return flat { state } for easier consumption
    return { state: data.instance.state }
  },

  async connectInstance(instanceName: string) {
    return request<{ base64?: string; code?: string; pairingCode?: string }>(
      `/instance/connect/${instanceName}`
    )
  },

  async deleteInstance(instanceName: string) {
    return request(`/instance/delete/${instanceName}`, { method: 'DELETE' })
  },

  // Messaging
  async sendText(instanceName: string, number: string, text: string) {
    return request(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ number, text }),
    })
  },

  async sendMedia(
    instanceName: string,
    params: {
      number: string
      mediatype: string
      media: string
      caption?: string
      fileName?: string
    }
  ) {
    return request(`/message/sendMedia/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  async sendAudio(instanceName: string, number: string, audio: string) {
    return request(`/message/sendWhatsAppAudio/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ number, audio }),
    })
  },

  // Webhook
  async setWebhook(instanceName: string, url: string, events: string[]) {
    return request(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        url,
        events,
        webhook_by_events: false,
        webhook_base64: true,
      }),
    })
  },
}
