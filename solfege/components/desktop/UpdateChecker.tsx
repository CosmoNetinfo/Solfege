'use client'

import { useEffect, useState } from 'react'
import { check, Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { Download, RefreshCw, X } from 'lucide-react'
import { isDesktop } from '@/lib/is-desktop'

export function UpdateChecker() {
  const [update, setUpdate] = useState<Update | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isDesktop()) return

    const checkForUpdates = async () => {
      try {
        const updateCheck = await check()
        if (updateCheck) {
          setUpdate(updateCheck)
          setIsOpen(true)
        }
      } catch (err) {
        console.error('Error checking for updates:', err)
      }
    }

    checkForUpdates()
    // Check for updates every 2 hours
    const interval = setInterval(checkForUpdates, 2 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (!update || !isOpen) return null

  const handleUpdate = async () => {
    try {
      setStatus('downloading')
      setDownloadProgress(0)

      let downloadedLength = 0
      let totalSize: number | undefined = undefined

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            setDownloadProgress(0)
            totalSize = event.data.contentLength
            break
          case 'Progress':
            downloadedLength += event.data.chunkLength
            if (totalSize) {
              const pct = Math.round((downloadedLength / totalSize) * 100)
              setDownloadProgress(pct)
            }
            break
          case 'Finished':
            setDownloadProgress(100)
            break
        }
      })

      setStatus('completed')
      // Relaunch app to apply update
      await relaunch()
    } catch (err: any) {
      console.error('Update failed:', err)
      setStatus('error')
      setErrorMessage(err.message || 'Errore durante l\'aggiornamento.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-white border border-stone-250/50 p-8 rounded-2xl shadow-xl max-w-md w-full relative space-y-6 animate-in zoom-in-95 duration-200">
        
        {status === 'idle' && (
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex justify-center text-[#E8621A]">
          <Download className="h-12 w-12 animate-bounce" />
        </div>

        <div className="space-y-2 text-center">
          <h3 className="text-xl font-serif font-bold text-stone-900">
            Aggiornamento disponibile
          </h3>
          <p className="text-sm text-stone-500">
            È disponibile una nuova versione: <strong className="text-stone-800">v{update.version}</strong>
          </p>
        </div>

        {update.body && (
          <div className="border border-stone-200 rounded-xl bg-stone-50 p-4 max-h-36 overflow-y-auto text-left">
            <h4 className="text-xs font-bold text-stone-400 mb-1">NOTE DI RILASCIO</h4>
            <p className="text-xs text-stone-600 font-mono whitespace-pre-wrap">{update.body}</p>
          </div>
        )}

        {status === 'downloading' && (
          <div className="space-y-2">
            <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-[#E8621A] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-stone-500">
              <span>DOWNLOAD IN CORSO...</span>
              <span>{downloadProgress}%</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-left">
            <strong>Errore di aggiornamento:</strong> {errorMessage}
          </div>
        )}

        <div className="flex gap-4">
          {status === 'idle' && (
            <>
              <button
                onClick={handleUpdate}
                className="flex-1 flex items-center justify-center gap-2 bg-[#E8621A] hover:bg-[#C94E0E] text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm uppercase tracking-wider shadow-sm"
              >
                Aggiorna ora
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold py-3 px-6 rounded-xl transition-colors text-sm uppercase tracking-wider"
              >
                Più tardi
              </button>
            </>
          )}

          {status === 'downloading' && (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-stone-200 text-stone-400 font-bold py-3 px-6 rounded-xl text-sm uppercase tracking-wider cursor-not-allowed"
            >
              <RefreshCw className="h-4 w-4 animate-spin" /> Download...
            </button>
          )}

          {status === 'completed' && (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-6 rounded-xl text-sm uppercase tracking-wider"
            >
              Riavvio in corso...
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={() => {
                setStatus('idle');
                setDownloadProgress(0);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#E8621A] hover:bg-[#C94E0E] text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm uppercase tracking-wider shadow-sm"
            >
              Riprova
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
