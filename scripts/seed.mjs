import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uhuhfafxurbqsfsgxyyc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodWhmYWZ4dXJicXNmc2d4eXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDE2MTgsImV4cCI6MjA4ODExNzYxOH0.S2dJQy_tcbxlTjF1jUdAeQs5ie7uQH6E2iseiLC9_eU'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const users = [
  { email: 'juan@fyreoficial.com.br', password: 'Juan@2024', name: 'Juan' },
  { email: 'rodrigo@fyreoficial.com.br', password: 'Rodrigo@2024', name: 'Rodrigo' },
]

async function seed() {
  for (const user of users) {
    console.log(`\nCriando usuario: ${user.name}...`)

    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
    })

    if (error) {
      console.error(`  Erro no signUp: ${error.message}`)
      continue
    }

    if (!data.user) {
      console.error(`  Nenhum usuario retornado`)
      continue
    }

    console.log(`  Auth criado: ${data.user.id}`)

    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id,
      name: user.name,
      email: user.email,
      role: 'admin',
    })

    if (insertError) {
      console.error(`  Erro ao inserir em public.users: ${insertError.message}`)
    } else {
      console.log(`  Inserido em public.users com sucesso!`)
    }
  }

  console.log('\n--- Credenciais de login ---')
  console.log('Juan:    juan@fyreoficial.com.br    / Juan@2024')
  console.log('Rodrigo: rodrigo@fyreoficial.com.br / Rodrigo@2024')
  console.log('')
}

seed()
