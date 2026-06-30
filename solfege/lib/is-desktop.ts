// Rileva se l'app gira in Tauri (desktop) o browser (web)
// Nota: Tauri v1 usa '__TAURI__', Tauri v2 usa '__TAURI_INTERNALS__'
export const isDesktop = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI__' in window || '__TAURI_INTERNALS__' in window)
  )
}
