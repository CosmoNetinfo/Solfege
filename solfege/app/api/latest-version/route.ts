import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Interroga le release pubbliche di GitHub
    const headers: Record<string, string> = {
      'User-Agent': 'Solfege-Updater-V2'
    };

    // Supporto per repository privati: se GITHUB_TOKEN è configurato, usalo
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    const githubRes = await fetch('https://api.github.com/repos/CosmoNetinfo/Solfege/releases/latest', {
      headers,
      next: { revalidate: 60 } // cache di 1 minuto
    });

    // Gestione errori GitHub in modo graceful
    if (githubRes.status === 404) {
      // Nessuna release pubblicata trovata (repo privato senza token, o nessuna release pubblicata)
      console.warn("GitHub API 404: nessuna release trovata. Il repo potrebbe essere privato o non avere release pubblicate.");
      return new NextResponse(null, { status: 204 });
    }

    if (githubRes.status === 403) {
      // Rate limit o accesso negato
      console.warn("GitHub API 403: accesso negato o rate limit raggiunto.");
      return new NextResponse(null, { status: 204 });
    }

    if (!githubRes.ok) {
      console.error(`GitHub API error: ${githubRes.status} ${githubRes.statusText}`);
      return NextResponse.json({ error: `GitHub API error: ${githubRes.statusText}` }, { status: 500 });
    }

    const release = await githubRes.json();
    if (!release || !release.tag_name) {
      return new NextResponse(null, { status: 204 });
    }

    // Il tag_name è nel formato "v1.3.2" -> estraiamo la versione "1.3.2"
    const version = release.tag_name.replace(/^v/, '');
    const tag = release.tag_name;

    // Costruisce i link degli update compressi .zip/tar.gz che Tauri richiede per l'updater
    // NOTA: GitHub Actions genera i file senza accento "Solfege" (non "Solfège")
    const winZipUrl = `https://github.com/CosmoNetinfo/Solfege/releases/download/${tag}/Solfege_${version}_x64-setup.nsis.zip`;
    const macX64TarUrl = `https://github.com/CosmoNetinfo/Solfege/releases/download/${tag}/Solfege_x64.app.tar.gz`;
    const macAarch64TarUrl = `https://github.com/CosmoNetinfo/Solfege/releases/download/${tag}/Solfege_aarch64.app.tar.gz`;

    // Recupera le firme digitali (.sig) da GitHub Releases
    const fetchSig = async (url: string): Promise<string> => {
      try {
        const sigRes = await fetch(`${url}.sig`, {
          headers: githubToken ? { 'Authorization': `Bearer ${githubToken}` } : {}
        });
        if (sigRes.ok) return (await sigRes.text()).trim();
      } catch (e) {
        console.warn(`Impossibile recuperare firma per ${url}:`, e);
      }
      return '';
    };

    const [winSignature, macX64Signature, macAarch64Signature] = await Promise.all([
      fetchSig(winZipUrl),
      fetchSig(macX64TarUrl),
      fetchSig(macAarch64TarUrl),
    ]);

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

    if (macX64Signature) {
      tauriResponse.platforms['darwin-x86_64'] = {
        signature: macX64Signature,
        url: macX64TarUrl
      };
    }

    if (macAarch64Signature) {
      tauriResponse.platforms['darwin-aarch64'] = {
        signature: macAarch64Signature,
        url: macAarch64TarUrl
      };
    }

    // Se non ci sono piattaforme firmate disponibili, ritorna 204 No Content
    if (Object.keys(tauriResponse.platforms).length === 0) {
      console.warn(`Nessun file .sig trovato per la release ${tag}. Verifica che TAURI_SIGNING_PRIVATE_KEY sia configurato nei GitHub Secrets.`);
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(tauriResponse);

  } catch (err: any) {
    console.error("Errore nell'endpoint latest-version:", err);
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
