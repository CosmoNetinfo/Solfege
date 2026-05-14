'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AcceptInvitePage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      else router.push('/login')
    })
  }, [])

  async function handleSubmit() {
    if (password !== confirm) { setError('Le password non coincidono'); return }
    if (password.length < 8) { setError('Minimo 8 caratteri'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).maybeSingle()
    router.push(profile?.role === 'insegnante' ? '/teacher/home' : '/admin/dashboard')
  }

  if (!ready) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontFamily:'DM Sans, sans-serif' }}>
      Caricamento...
    </div>
  )

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'DM Sans, sans-serif' }}>
      {/* Sinistra */}
      <div style={{ flex:1, background:'#1A1714', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <Image src="/logo.png" alt="Solfège Logo" width={180} height={60} style={{ objectFit:'contain', marginBottom:'1rem' }} />
        <p style={{ color:'#C8C1BA', marginTop:'0.5rem', textAlign:'center' }}>Il tuo portale docenti ti aspetta</p>
      </div>
      {/* Destra */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#FAFAF9', padding:'2rem' }}>
        <div style={{ width:'100%', maxWidth:'400px' }}>
          <h2 style={{ fontSize:'1.5rem', fontWeight:600, marginBottom:'0.5rem', color:'#1A1714' }}>Benvenuto su Solfège</h2>
          <p style={{ color:'#7A736C', marginBottom:'2rem' }}>Scegli la tua password per accedere al portale docenti.</p>
          {error && <p style={{ color:'#C0392B', marginBottom:'1rem', fontSize:'0.9rem' }}>{error}</p>}
          <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#1A1714', display:'block', marginBottom:'0.25rem' }}>Nuova password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Minimo 8 caratteri"
            style={{ width:'100%', padding:'0.65rem 0.75rem', border:'1px solid #E2DDD8', borderRadius:'6px', marginBottom:'1rem', fontSize:'0.9rem', background:'white', boxSizing:'border-box' }}
          />
          <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#1A1714', display:'block', marginBottom:'0.25rem' }}>Conferma password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Ripeti la password"
            style={{ width:'100%', padding:'0.65rem 0.75rem', border:'1px solid #E2DDD8', borderRadius:'6px', marginBottom:'1.5rem', fontSize:'0.9rem', background:'white', boxSizing:'border-box' }}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width:'100%', background:'#E8621A', color:'white', padding:'0.85rem', borderRadius:'6px', border:'none', fontWeight:600, fontSize:'1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1 }}
          >
            {loading ? 'Salvataggio...' : 'Accedi al portale →'}
          </button>
        </div>
      </div>
    </div>
  )
}
