'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { isDesktop } from '@/lib/is-desktop'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  expanded: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    expanded: false,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    if (isDesktop()) {
      // Send error to the backend
      const reportError = async () => {
        try {
          const osInfo = typeof window !== 'undefined' ? window.navigator.userAgent : 'desktop'
          await invoke('report_error', {
            licenseKey: null,
            errorType: 'ReactCrash',
            message: error.message || 'React crash error',
            stack: error.stack || errorInfo.componentStack || null,
            screen: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
            action: 'render',
            appVersion: '1.0.0',
            osInfo: osInfo,
          })
        } catch (e) {
          console.error('Failed to report error to desktop backend:', e)
        }
      }
      reportError()
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, expanded: false })
  }

  private handleGoHome = () => {
    this.handleReset()
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/dashboard'
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6 font-sans">
          <div className="bg-white border border-stone-250/50 p-8 rounded-2xl shadow-sm max-w-xl w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red/10 rounded-full text-red-600">
                <AlertTriangle className="h-12 w-12" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-stone-900">Si è verificato un errore</h2>
              <p className="text-sm text-stone-500">
                L'applicazione ha riscontrato un problema imprevisto. L'errore è stato segnalato automaticamente per il debug.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 bg-[#E8621A] hover:bg-[#C94E0E] text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm text-sm uppercase tracking-wider"
              >
                <RefreshCw className="h-4 w-4" /> Riprova
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold py-2.5 px-5 rounded-xl transition-all text-sm uppercase tracking-wider"
              >
                <Home className="h-4 w-4" /> Dashboard
              </button>
            </div>

            {this.state.error && (
              <div className="text-left border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                <button
                  onClick={() => this.setState({ expanded: !this.state.expanded })}
                  className="w-full flex items-center justify-between p-3 text-xs font-bold text-stone-500 border-b border-stone-200 hover:bg-stone-100 transition-colors"
                >
                  <span>DETTAGLI TECNICI DI ERRORE</span>
                  {this.state.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {this.state.expanded && (
                  <pre className="p-4 text-xs font-mono text-stone-700 overflow-auto max-h-48 whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
export default ErrorBoundary
