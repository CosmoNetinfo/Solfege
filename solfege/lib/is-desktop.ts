// Rileva se l'app gira in Tauri (desktop) o browser (web)
export const isDesktop = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window
}
