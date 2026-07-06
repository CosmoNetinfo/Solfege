import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Interroga le release pubbliche di GitHub
    const githubRes = await fetch('https://api.github.com/repos/CosmoNetinfo/Solfege/releases/latest', {
      headers: {
        'User-Agent': 'Solfege-Updater-V2'
      },
      next: { revalidate: 60 } // cache di 1 minuto
    });

    if (!githubRes.ok) {
      return NextResponse.json({ error: `GitHub API error: ${githubRes.statusText}` }, { status: 500 });
    }

    const release = await githubRes.json();
    if (!release || !release.tag_name) {
      return NextResponse.json({ version: '0.0.0' });
    }

    // Il tag_name è nel formato "v1.3.2" -> estraiamo la versione "1.3.2"
    const version = release.tag_name.replace(/^v/, '');
    const tag = release.tag_name;

    // Costruisce i link degli update compressi .zip/tar.gz che Tauri richiede per l'updater
    // Tauri per Windows richiede il file .nsis.zip
    const winZipUrl = `https://github.com/CosmoNetinfo/Solfege/releases/download/${tag}/Solfege_${version}_x64-setup.nsis.zip`;
    const macTarUrl = `https://github.com/CosmoNetinfo/Solfege/releases/download/${tag}/Solfege_${version}_x64.app.tar.gz`;

    // Recupera la firma digitale (.sig) da GitHub Releases
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
      notes: release.body || 'Nuovo aggiornamento disponibile',
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

    // Se non ci sono piattaforme firmate disponibili, ritorna 204 No Content
    if (Object.keys(tauriResponse.platforms).length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(tauriResponse);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
