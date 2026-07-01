import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminDb = createAdminClient()

    const { data: releaseRes, error } = await adminDb
      .from('app_releases' as any)
      .select('version, release_notes, windows_url, mac_url, linux_url, published_at')
      .eq('is_current', true)
      .maybeSingle()

    const release = releaseRes as any

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!release) {
      return NextResponse.json({ version: '0.0.0' })
    }

    const version = release.version;
    const tag = `v${version}`;

    // Costruisce i link degli update compressi .zip/tar.gz che Tauri richiede per l'updater
    // Tauri per aggiornare Windows richiede il file .nsis.zip
    const winZipUrl = `https://github.com/CosmoNetinfo/Solfege/releases/download/${tag}/Solfege_${version}_x64-setup.nsis.zip`;
    const macTarUrl = `https://github.com/CosmoNetinfo/Solfege/releases/download/${tag}/Solfege_${version}_x64.app.tar.gz`;
    const linuxTarUrl = `https://github.com/CosmoNetinfo/Solfege/releases/download/${tag}/Solfege_aarch64.app.tar.gz`; // fallback

    // Per recuperare le firme digitali (.sig), l'endpoint fa una fetch al file .sig generato su GitHub Releases
    // In questo modo evitiamo di dover inserire a mano le firme nel DB Supabase.
    let winSignature = '';
    try {
      const sigRes = await fetch(`${winZipUrl}.sig`);
      if (sigRes.ok) {
        winSignature = (await sigRes.text()).trim();
      }
    } catch (e) {
      console.warn("Impossibile recuperare firma Windows da GitHub:", e);
    }

    let macSignature = '';
    try {
      const sigRes = await fetch(`${macTarUrl}.sig`);
      if (sigRes.ok) {
        macSignature = (await sigRes.text()).trim();
      }
    } catch (e) {
      console.warn("Impossibile recuperare firma MacOS da GitHub:", e);
    }

    // Risposta nel formato ufficiale richiesto da Tauri v2 Updater
    const tauriResponse: any = {
      version: version,
      notes: release.release_notes,
      pub_date: release.published_at || new Date().toISOString(),
      platforms: {}
    };

    if (winSignature) {
      tauriResponse.platforms['windows-x86_64'] = {
        signature: winSignature,
        url: winZipUrl
      };
    }

    if (macSignature) {
      tauriResponse.platforms['darwin-x86_64'] = {
        signature: macSignature,
        url: macTarUrl
      };
      tauriResponse.platforms['darwin-aarch64'] = {
        signature: macSignature,
        url: macTarUrl
      };
    }

    // Se non ci sono piattaforme firmate disponibili per questa versione,
    // Tauri v2 si aspetta uno status 204 No Content per indicare che non ci sono aggiornamenti.
    if (Object.keys(tauriResponse.platforms).length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(tauriResponse);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
