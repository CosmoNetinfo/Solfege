'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AcceptInvitePage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Supabase manda il token nel fragment #access_token=...&type=invite
    // Il client Supabase lo legge automaticamente dal fragment
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setReady(true)
        }
        if (event === 'PASSWORD_RECOVERY') {
          setReady(true)
        }
      }
    )

    // Controlla se c'è già una sessione attiva
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit() {
    if (password !== confirm) { setError('Le password non coincidono'); return }
    if (password.length < 8) { setError('Minimo 8 caratteri'); return }
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    router.push(profile?.role === 'insegnante' ? '/teacher/home' : '/admin/dashboard')
  }

  if (!ready) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontFamily:'DM Sans, sans-serif', flexDirection:'column', gap:'1rem' }}>
      <div>Caricamento sessione in corso...</div>
      <div style={{ fontSize:'0.8rem', color:'#7A736C' }}>Se questa schermata persiste, il link potrebbe essere scaduto.</div>
    </div>
  )

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'DM Sans, sans-serif' }}>
      <div style={{ flex:1, background:'#1A1714', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', color:'#E8621A', fontSize:'3rem', margin:0 }}>Solfège</h1>
        <p style={{ color:'#C8C1BA', marginTop:'0.5rem', textAlign:'center' }}>Il tuo portale docenti ti aspetta</p>
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#FAFAF9', padding:'2rem' }}>
        <div style={{ width:'100%', maxWidth:'400px' }}>
          <h2 style={{ fontSize:'1.5rem', fontWeight:600, marginBottom:'0.5rem', color:'#1A1714' }}>Benvenuto su Solfège</h2>
          <p style={{ color:'#7A736C', marginBottom:'2rem' }}>Scegli la tua password per accedere al portale docenti.</p>
          {error && <p style={{ color:'#C0392B', marginBottom:'1rem', fontSize:'0.9rem' }}>{error}</p>}
          <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#1A1714', display:'block', marginBottom:'0.25rem' }}>Nuova password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimo 8 caratteri" style={{ width:'100%', marginBottom:'1rem', padding:'0.6rem', borderRadius:'6px', border:'1px solid #E8E4E0', display:'block' }} />
          <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#1A1714', display:'block', marginBottom:'0.25rem' }}>Conferma password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Ripeti la password" style={{ width:'100%', marginBottom:'1.5rem', padding:'0.6rem', borderRadius:'6px', border:'1px solid #E8E4E0', display:'block' }} />
          <button onClick={handleSubmit} disabled={loading} style={{ width:'100%', background:'#E8621A', color:'white', padding:'0.85rem', borderRadius:'6px', border:'none', fontWeight:600, fontSize:'1rem', cursor:'pointer' }}>
            {loading ? 'Salvataggio...' : 'Accedi al portale →'}
          </button>
        </div>
      </div>
    </div>
  )
}
