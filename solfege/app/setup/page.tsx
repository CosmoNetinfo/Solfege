'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { invoke } from '@tauri-apps/api/core'
import Database from '@tauri-apps/plugin-sql'
import { Key, User, Landmark, Sparkles, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { isDesktop } from '@/lib/is-desktop'
import { createClient } from '@/lib/supabase/client'

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()
  
  // Step 2 state
  const [licenseKey, setLicenseKey] = useState('')
  
  // Step 3 state
  const [userData, setUserData] = useState({
    nome: '',
    cognome: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  // Step 4 state
  const [schoolData, setSchoolData] = useState({
    nome: '',
    indirizzo: '',
    citta: '',
    telefono: '',
    email: ''
  })

  useEffect(() => {
    if (!isDesktop()) {
      router.push('/')
      return
    }

    // Controlla se il setup è già completato
    const checkSetup = async () => {
      try {
        const completed = await invoke<string | null>('get_config', { key: 'setup_completed' })
        if (completed === 'true') {
          router.push('/login-desktop')
        }
      } catch (err) {
        console.error('Error checking setup status:', err)
      }
    }
    checkSetup()
  }, [router])

  // Formatta la chiave di licenza: SOLFEGE-XXXX-XXXX-XXXX
  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    // Remove "SOLFEGE" prefix from the typed values to process the format correctly if user pastes it
    if (value.startsWith('SOLFEGE')) {
      value = value.substring(7)
    }

    let formatted = 'SOLFEGE'
    
    // Split into segments of 4 chars
    const segments = []
    for (let i = 0; i < value.length && i < 12; i += 4) {
      segments.push(value.substring(i, i + 4))
    }

    if (segments.length > 0) {
      formatted += '-' + segments.join('-')
    }

    setLicenseKey(formatted)
    setError('')
  }

  // Submit Step 2 - Attiva licenza
  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (licenseKey.length < 22) {
      setError('Inserisci una chiave di licenza valida (es. SOLFEGE-XXXX-XXXX-XXXX)')
      return
    }

    setLoading(true)
    setError('')
    try {
      // Per semplicità usiamo un machine_id generato o basato su host
      const machineId = 'desktop-local'
      const success = await invoke<boolean>('activate_license', { 
        licenseKey, 
        machineId 
      })

      if (success) {
        setSuccess('Licenza attivata con successo!')
        setTimeout(() => {
          setSuccess('')
          setStep(3)
        }, 1500)
      } else {
        setError('Attivazione fallita.')
      }
    } catch (err: any) {
      setError(err || 'Errore durante l\'attivazione della licenza.')
    } finally {
      setLoading(false)
    }
  }

  // Submit Step 3 - Crea account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    const { nome, cognome, username, password, confirmPassword } = userData
    if (!nome || !cognome || !username || !password) {
      setError('Tutti i campi contrassegnati con * sono obbligatori.')
      return
    }
    if (password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri.')
      return
    }
    if (password !== confirmPassword) {
      setError('Le password non coincidono.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await invoke('create_first_user', { username, password, nome, cognome })
      
      // Crea anche l'account corrispondente su Supabase
      try {
        const { error: signUpError } = await supabase.auth.signUp({
          email: username,
          password: password,
          options: {
            data: {
              role: 'admin',
              nome: nome,
              cognome: cognome
            }
          }
        })
        if (signUpError) {
          console.error('[AUTH] Supabase signUp error:', signUpError.message)
        } else {
          console.log('[AUTH] Supabase signUp OK')
        }
      } catch (supabaseCatch) {
        console.error('[AUTH] Fallimento client Supabase durante setup:', supabaseCatch)
      }

      setSuccess('Account amministratore creato!')
      setTimeout(() => {
        setSuccess('')
        setStep(4)
      }, 1500)
    } catch (err: any) {
      setError(err || 'Errore durante la creazione dell\'account.')
    } finally {
      setLoading(false)
    }
  }

  // Submit Step 4 - Salva dati scuola
  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolData.nome) {
      setError('Il nome della scuola è obbligatorio.')
      return
    }

    setLoading(true)
    setError('')
    try {
      // Inserisci scuola in SQLite
      const db = await Database.load('sqlite:solfege.db')
      const schoolId = crypto.randomUUID()
      
      await db.execute(
        `INSERT INTO schools (id, nome, indirizzo, citta, telefono, email, anno_accademico_corrente) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          schoolId,
          schoolData.nome,
          schoolData.indirizzo || null,
          schoolData.citta || null,
          schoolData.telefono || null,
          schoolData.email || null,
          '2026/2027' // anno accademico iniziale
        ]
      )

      // Segna setup completato in config
      await invoke('set_config', { key: 'setup_completed', value: 'true' })

      setSuccess('Scuola configurata con successo!')
      setTimeout(() => {
        router.push('/login-desktop')
      }, 1500)
    } catch (err: any) {
      setError(err || 'Errore durante il salvataggio dei dati scuola.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6 font-sans">
      <div className="bg-white border border-stone-200 p-8 rounded-2xl shadow-sm max-w-md w-full space-y-8">
        
        {/* Progress bar / dots */}
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3, 4].map((num) => (
            <div 
              key={num} 
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                step === num ? 'bg-[#E8621A] scale-125' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in duration-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in duration-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* STEP 1: Benvenuto */}
        {step === 1 && (
          <div className="text-center space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-serif text-stone-900 tracking-wide">Solfège</h1>
              <h2 className="text-xl font-serif font-bold text-stone-700 mt-2">Benvenuto in Solfège</h2>
              <p className="text-sm text-stone-500 max-w-xs mx-auto leading-relaxed">
                Configuriamo la tua scuola di musica in pochi passaggi per essere operativi subito.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 bg-[#E8621A] hover:bg-[#C94E0E] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm text-sm uppercase tracking-wider"
            >
              Inizia <Sparkles className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Attiva licenza */}
        {step === 2 && (
          <form onSubmit={handleActivateLicense} className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-serif font-bold text-stone-900">Attiva la tua licenza</h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                Inserisci la chiave di licenza ricevuta dopo l'acquisto per sbloccare l'applicazione.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Chiave di Licenza</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                    <Key className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={handleLicenseChange}
                    maxLength={27}
                    placeholder="SOLFEGE-XXXX-XXXX-XXXX"
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-sm uppercase focus:outline-none focus:ring-1 focus:ring-[#E8621A] focus:border-[#E8621A] transition-all"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#E8621A] hover:bg-[#C94E0E] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Attiva licenza'}
            </button>
          </form>
        )}

        {/* STEP 3: Crea account */}
        {step === 3 && (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-serif font-bold text-stone-900">Crea account admin</h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                Inserisci i dati per il tuo primo account amministratore locale.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nome *</label>
                <input
                  type="text"
                  value={userData.nome}
                  onChange={(e) => setUserData({ ...userData, nome: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#E8621A] focus:border-[#E8621A]"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Cognome *</label>
                <input
                  type="text"
                  value={userData.cognome}
                  onChange={(e) => setUserData({ ...userData, cognome: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#E8621A] focus:border-[#E8621A]"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Username *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={userData.username}
                  onChange={(e) => setUserData({ ...userData, username: e.target.value.toLowerCase().trim() })}
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#E8621A] focus:border-[#E8621A]"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={userData.password}
                    onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#E8621A] focus:border-[#E8621A]"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Conferma *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={userData.confirmPassword}
                  onChange={(e) => setUserData({ ...userData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#E8621A] focus:border-[#E8621A]"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#E8621A] hover:bg-[#C94E0E] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm text-sm uppercase tracking-wider mt-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crea account'}
            </button>
          </form>
        )}

        {/* STEP 4: Dati scuola */}
        {step === 4 && (
          <form onSubmit={handleSaveSchool} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-serif font-bold text-stone-900">Configura la tua scuola</h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                Inserisci le informazioni generali della tua scuola di musica.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nome Scuola *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                  <Landmark className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={schoolData.nome}
                  onChange={(e) => setSchoolData({ ...schoolData, nome: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#E8621A] focus:border-[#E8621A]"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Indirizzo</label>
                <input
                  type="text"
                  value={schoolData.indirizzo}
                  onChange={(e) => setSchoolData({ ...schoolData, indirizzo: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Città</label>
                <input
                  type="text"
                  value={schoolData.citta}
                  onChange={(e) => setSchoolData({ ...schoolData, citta: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Telefono</label>
                <input
                  type="text"
                  value={schoolData.telefono}
                  onChange={(e) => setSchoolData({ ...schoolData, telefono: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={schoolData.email}
                  onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#E8621A] hover:bg-[#C94E0E] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm text-sm uppercase tracking-wider mt-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salva e Inizia'}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
