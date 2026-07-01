'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { invoke } from '@tauri-apps/api/core'
import { User, Key, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { isDesktop } from '@/lib/is-desktop'
import { createClient } from '@/lib/supabase/client'

export default function LoginDesktopPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!isDesktop()) {
      router.push('/')
      return
    }

    // Controlla se il setup è stato completato, altrimenti forza setup
    const checkSetup = async () => {
      try {
        const completed = await invoke<string | null>('get_config', { key: 'setup_completed' })
        if (completed !== 'true') {
          router.push('/setup')
        }
      } catch (err) {
        console.error('Error checking setup status, redirecting to setup:', err)
        router.push('/setup')
      }
    }
    checkSetup()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Inserisci sia username che password.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const user = await invoke('login', { username, password })
      if (user) {
        // Accedi anche su Supabase per sincronizzare la sessione cloud
        try {
          const { error: supabaseErr } = await supabase.auth.signInWithPassword({
            email: username,
            password: password,
          })
          if (supabaseErr) {
            console.error('[AUTH] Supabase login error:', supabaseErr.message)
          } else {
            console.log('[AUTH] Supabase login OK')
          }
        } catch (supabaseCatch) {
          console.error('[AUTH] Fallimento client Supabase:', supabaseCatch)
        }

        router.push('/admin/dashboard')
      } else {
        setError('Credenziali non valide.')
      }
    } catch (err: any) {
      // Tauri invoke errors arrivano come stringa o come oggetto con .message
      const msg = typeof err === 'string' ? err : (err?.message ?? 'Username o password errati.')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6 font-sans">
      <div className="bg-white border border-stone-200 p-8 rounded-2xl shadow-sm max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-serif text-stone-900 tracking-wide">Solfège</h1>
          <p className="text-xs font-serif font-bold text-stone-400 uppercase tracking-widest">
            Gestionale Scuola di Musica
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in duration-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1.5">Email</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                placeholder="mario@tuascuola.it"
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#E8621A] focus:border-[#E8621A] transition-all"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                <Key className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#E8621A] focus:border-[#E8621A] transition-all"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#E8621A] hover:bg-[#C94E0E] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}
