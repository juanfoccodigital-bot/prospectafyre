'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, FileSpreadsheet, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUsers } from '@/hooks/use-user'
import { toast } from 'sonner'

interface ParsedLead {
  nome: string
  telefone: string
  email: string
  cidade: string
  estado: string
  ddd: string
  especialidade: string
  faturamento: string
  observacoes: string
}

export function LeadUpload() {
  const [parsedData, setParsedData] = useState<ParsedLead[]>([])
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const { users } = useUsers()
  const supabase = createClient()

  const normalizeHeaders = (headers: string[]) => {
    const map: Record<string, string> = {}
    headers.forEach((h) => {
      const lower = h.toLowerCase().trim()
      if (lower.includes('nome') || lower.includes('name')) map[h] = 'nome'
      else if (lower.includes('telefone') || lower.includes('phone') || lower.includes('fone')) map[h] = 'telefone'
      else if (lower.includes('email') || lower.includes('e-mail')) map[h] = 'email'
      else if (lower.includes('cidade') || lower.includes('city')) map[h] = 'cidade'
      else if (lower.includes('estado') || lower.includes('uf') || lower.includes('state')) map[h] = 'estado'
      else if (lower.includes('ddd')) map[h] = 'ddd'
      else if (lower.includes('especialidade') || lower.includes('specialty')) map[h] = 'especialidade'
      else if (lower.includes('faturamento') || lower.includes('revenue') || lower.includes('billing')) map[h] = 'faturamento'
      else if (lower.includes('obs') || lower.includes('nota') || lower.includes('note')) map[h] = 'observacoes'
    })
    return map
  }

  const parseFile = useCallback((file: File) => {
    setFileName(file.name)
    setDone(false)

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || []
          const headerMap = normalizeHeaders(headers)
          const data = (results.data as Record<string, string>[]).map((row) => {
            const mapped: Record<string, string> = {}
            Object.entries(row).forEach(([key, val]) => {
              const field = headerMap[key]
              if (field) mapped[field] = val || ''
            })
            return mapped as unknown as ParsedLead
          }).filter((r) => r.nome?.trim())
          setParsedData(data)
        },
      })
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

        if (json.length > 0) {
          const headers = Object.keys(json[0])
          const headerMap = normalizeHeaders(headers)
          const parsed = json.map((row) => {
            const mapped: Record<string, string> = {}
            Object.entries(row).forEach(([key, val]) => {
              const field = headerMap[key]
              if (field) mapped[field] = String(val || '')
            })
            return mapped as unknown as ParsedLead
          }).filter((r) => r.nome?.trim())
          setParsedData(parsed)
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        parseFile(file)
      } else {
        toast.error('Formato inválido. Use CSV ou XLSX.')
      }
    },
    [parseFile]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  const parseFaturamento = (raw: string): number | null => {
    if (!raw?.trim()) return null

    const text = raw
      .toLowerCase()
      .replace(/r\$/g, '')
      .replace(/_/g, ' ')
      .trim()

    // Parse a single value like "30.000", "50mil", "25k"
    const parseValue = (s: string): number | null => {
      const cleaned = s.trim()
      if (!cleaned) return null

      // "50mil" or "50 mil"
      const milMatch = cleaned.match(/^([\d.,]+)\s*mil/)
      if (milMatch) {
        const num = parseFloat(milMatch[1].replace(/\./g, '').replace(',', '.'))
        return isNaN(num) ? null : num * 1000
      }

      // "25k"
      const kMatch = cleaned.match(/^([\d.,]+)\s*k/i)
      if (kMatch) {
        const num = parseFloat(kMatch[1].replace(/\./g, '').replace(',', '.'))
        return isNaN(num) ? null : num * 1000
      }

      // "30.000" (Brazilian decimal separator is dot for thousands)
      // or "30000" or "30,5"
      const numStr = cleaned.replace(/[^\d.,]/g, '')
      if (!numStr) return null

      // If has dots and no comma, dots are thousands separators: "30.000" → 30000
      if (numStr.includes('.') && !numStr.includes(',')) {
        const parts = numStr.split('.')
        // If last part has 3 digits, it's a thousands separator
        if (parts[parts.length - 1].length === 3) {
          return parseFloat(numStr.replace(/\./g, '')) || null
        }
      }

      // Comma as decimal: "30,5" → 30.5
      const normalized = numStr.replace(/\./g, '').replace(',', '.')
      const result = parseFloat(normalized)
      return isNaN(result) ? null : result
    }

    // Check for range: "X a Y", "X_a_Y", "X - Y"
    const rangeMatch = text.match(/^(.+?)(?:\s+a\s+|\s*-\s*)(.+)$/)
    if (rangeMatch) {
      const rawLow = rangeMatch[1].trim()
      const rawHigh = rangeMatch[2].trim()
      let low = parseValue(rawLow)
      const high = parseValue(rawHigh)

      // "30 a 50mil" or "25 a 30k" → first number has no unit, inherit from second
      const highHasUnit = /mil|k/i.test(rawHigh)
      const lowHasUnit = /mil|k|\..*\d{3}/.test(rawLow) // mil, k, or 30.000
      if (low !== null && high !== null && highHasUnit && !lowHasUnit && low < high / 10) {
        // "30" should be 30,000 like "50mil" is 50,000
        low = low * 1000
      }

      if (low !== null && high !== null) return Math.round((low + high) / 2)
      if (high !== null) return high
      if (low !== null) return low
    }

    return parseValue(text)
  }

  const splitDdd = (telefone: string, ddd: string): { ddd: string; telefone: string } => {
    // If DDD already provided, keep as-is
    if (ddd?.trim()) return { ddd: ddd.trim(), telefone: telefone.trim() }

    // Clean phone: remove non-digits
    const digits = telefone.replace(/\D/g, '')

    // Brazilian phone: 10-11 digits (2 DDD + 8-9 number)
    if (digits.length >= 10 && digits.length <= 11) {
      return { ddd: digits.slice(0, 2), telefone: digits.slice(2) }
    }

    // With country code 55: 12-13 digits
    if (digits.length >= 12 && digits.length <= 13 && digits.startsWith('55')) {
      return { ddd: digits.slice(2, 4), telefone: digits.slice(4) }
    }

    return { ddd: '', telefone: telefone.trim() }
  }

  const handleUpload = async () => {
    if (users.length < 2) {
      toast.error('É necessário ter ao menos 2 usuários cadastrados.')
      return
    }

    setUploading(true)
    const userIds = users.map((u) => u.id)

    // Alternating 50/50 distribution
    const leadsToInsert = parsedData.map((lead, index) => {
      const { ddd, telefone } = splitDdd(lead.telefone || '', lead.ddd || '')
      return {
        nome: lead.nome,
        telefone: telefone || null,
        email: lead.email || null,
        cidade: lead.cidade || null,
        estado: lead.estado || null,
        ddd: ddd || null,
        especialidade: lead.especialidade || null,
        faturamento: parseFaturamento(lead.faturamento),
        observacoes: lead.observacoes || null,
        status: 'novo',
        assigned_to: userIds[index % 2],
        resposta: false,
      }
    })

    // Insert in batches of 500
    const batchSize = 500
    let inserted = 0

    for (let i = 0; i < leadsToInsert.length; i += batchSize) {
      const batch = leadsToInsert.slice(i, i + batchSize)
      const { error } = await supabase.from('leads').insert(batch)
      if (error) {
        toast.error(`Erro ao inserir lote ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        setUploading(false)
        return
      }
      inserted += batch.length
    }

    const user1Count = leadsToInsert.filter((l) => l.assigned_to === userIds[0]).length
    const user2Count = leadsToInsert.filter((l) => l.assigned_to === userIds[1]).length

    toast.success(
      `${inserted} leads importados! ${users[0]?.name}: ${user1Count} | ${users[1]?.name}: ${user2Count}`
    )
    setUploading(false)
    setDone(true)
  }

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-300 ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-primary/5'
            }`}
          >
            <motion.div
              animate={{ y: dragOver ? -10 : 0 }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
            >
              <Upload className="h-8 w-8 text-primary" />
            </motion.div>
            <p className="mb-2 text-lg font-medium">
              Arraste sua planilha aqui
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              Formatos aceitos: CSV, XLSX
            </p>
            <label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
              <Button variant="outline" asChild className="cursor-pointer">
                <span>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Selecionar arquivo
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {parsedData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Pré-visualização</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {fileName} - {parsedData.length} leads encontrados
                </p>
              </div>
              <div className="flex items-center gap-3">
                {done ? (
                  <Badge className="gap-1 bg-fyre text-fyre-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    Importado
                  </Badge>
                ) : (
                  <>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{users[0]?.name}: {Math.ceil(parsedData.length / 2)} leads</p>
                      <p>{users[1]?.name}: {Math.floor(parsedData.length / 2)} leads</p>
                    </div>
                    <Button onClick={handleUpload} disabled={uploading} className="gap-2">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Importar {parsedData.length} leads
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Telefone</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Cidade</TableHead>
                      <TableHead className="text-xs">UF</TableHead>
                      <TableHead className="text-xs">DDD</TableHead>
                      <TableHead className="text-xs">Especialidade</TableHead>
                      <TableHead className="text-xs">Faturamento</TableHead>
                      <TableHead className="text-xs">Atribuído a</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 50).map((lead, i) => {
                      const split = splitDdd(lead.telefone || '', lead.ddd || '')
                      return (
                      <TableRow key={i} className="border-border/30">
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-sm">{lead.nome}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{split.telefone}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{lead.email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{lead.cidade}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{lead.estado}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{split.ddd}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{lead.especialidade}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {parseFaturamento(lead.faturamento)
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(parseFaturamento(lead.faturamento)!)
                            : lead.faturamento || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {users[i % 2]?.name || '...'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {parsedData.length > 50 && (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    Mostrando 50 de {parsedData.length} leads
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
