'use client'

import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { AlertTriangle, Key } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { isDesktop } from '@/lib/is-desktop'

interface TrialStatus {
  is_trial: boolean
  days_remaining: number
  is_expired: boolean
  license_key: string | null
}

export function TrialBanner() {
  const [status, setStatus] = useState<TrialStatus | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!isDesktop()) return

    const fetchStatus = async () => {
      try {
        const res = await invoke<TrialStatus>('get_trial_status')
        setStatus(res)
        
        if (res.is_trial && res.is_expired) {
          router.push('/setup')
        }
      } catch (err) {
        console.error('Error fetching trial status:', err)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // check every minute
    return () => clearInterval(interval)
  }, [router])

  if (!status || !status.is_trial || status.is_expired) return null

  const days = status.days_remaining

  if (days > 10) return null

  // giorni 10-6: giallo
  // giorni 5-0: arancione/rosso
  const isWarning = days <= 5
  const bgClass = isWarning ? 'bg-orange-600 text-white' : 'bg-yellow-500 text-stone-900'

  return (
    <div className={`w-full py-2 px-4 flex items-center justify-between text-xs font-semibold ${bgClass} animate-in slide-in-from-top duration-300 shadow-sm z-50 relative`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
        <span>
          {isWarning 
            ? `SOLO ${days} GIORNI RIMANENTI DI PROVA! Attiva subito la tua licenza.`
            : `Mancano ${days} giorni al termine del periodo di prova di Solfège.`
          }
        </span>
      </div>
      <button 
        onClick={() => router.push('/setup')} 
        className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold uppercase tracking-wider transition-colors ${
          isWarning ? 'bg-white text-orange-600 hover:bg-orange-50' : 'bg-stone-900 text-yellow-500 hover:bg-stone-800'
        }`}
      >
        <Key className="h-3 w-3" /> Attiva Ora
      </button>
    </div>
  )
}
