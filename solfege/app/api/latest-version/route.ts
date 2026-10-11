import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Solfege-Updater-V2'
    };

    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    // 1. Recupera la release più recente per ottenere il tag
    const releaseRes = await fetch(
      'https://api.github.com/repos/CosmoNetinfo/Solfege/releases/latest',
      { headers, next: { revalidate: 60 } }
    );

    if (releaseRes.status === 404 || releaseRes.status === 403) {
      return new NextResponse(null, { status: 204 });
    }

    if (!releaseRes.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${releaseRes.statusText}` },
        { status: 500 }
      );
    }

    const release = await releaseRes.json();
    if (!release?.tag_name) {
      return new NextResponse(null, { status: 204 });
    }

    const tag = release.tag_name;

    // 2. Cerca il file latest.json tra gli asset della release
    //    tauri-action lo carica automaticamente quando createUpdaterArtifacts è true
    const latestJsonAsset = release.assets?.find(
      (a: any) => a.name === 'latest.json'
    );

    if (latestJsonAsset) {
      const assetRes = await fetch(latestJsonAsset.browser_download_url, {
        headers: githubToken
          ? { 'Authorization': `Bearer ${githubToken}`, 'User-Agent': 'Solfege-Updater-V2' }
          : { 'User-Agent': 'Solfege-Updater-V2' }
      });

      if (assetRes.ok) {
        const manifest = await assetRes.json();
        if (release.body) manifest.notes = release.body;

        // Se manca la piattaforma Windows, la aggiungiamo dal .exe.sig
        const hasWindows = Object.keys(manifest.platforms || {}).some(k => k.startsWith('windows'));
        if (!hasWindows) {
          const version = tag.replace(/^v/, '');
          const exeSigAsset = release.assets?.find(
            (a: any) => a.name === `Solfege_${version}_x64-setup.exe.sig`
          );
          const exeAsset = release.assets?.find(
            (a: any) => a.name === `Solfege_${version}_x64-setup.exe`
          );
          if (exeSigAsset && exeAsset) {
            const sigRes = await fetch(exeSigAsset.browser_download_url, {
              headers: githubToken ? { 'Authorization': `Bearer ${githubToken}` } : {}
            });
            if (sigRes.ok) {
              const sig = (await sigRes.text()).trim();
              manifest.platforms['windows-x86_64'] = {
                signature: sig,
                url: exeAsset.browser_download_url
              };
            }
          }
        }

        return NextResponse.json(manifest);
      }
    }

    // 3. Fallback: costruisci il manifesto manualmente dai file .sig negli asset
    const winExeSig = release.assets?.find(
      (a: any) => a.name === `Solfege_${tag.replace('v', '')}_x64-setup.exe.sig`
    );
    const macX64Sig = release.assets?.find(
      (a: any) => a.name === 'Solfege_x64.app.tar.gz.sig'
    );
    const macAarch64Sig = release.assets?.find(
      (a: any) => a.name === 'Solfege_aarch64.app.tar.gz.sig'
    );

    const fetchSigContent = async (url: string): Promise<string> => {
      try {
        const r = await fetch(url, {
          headers: githubToken
            ? { 'Authorization': `Bearer ${githubToken}`, 'User-Agent': 'Solfege-Updater-V2' }
            : { 'User-Agent': 'Solfege-Updater-V2' }
        });
        if (r.ok) return (await r.text()).trim();
      } catch (e) {
        console.warn('fetchSigContent error:', e);
      }
      return '';
    };

    const version = tag.replace(/^v/, '');
    const manifest: any = {
      version,
      notes: release.body || 'Nuovo aggiornamento disponibile',
      pub_date: release.published_at || new Date().toISOString(),
      platforms: {}
    };

    if (winExeSig) {
      const sig = await fetchSigContent(winExeSig.browser_download_url);
      const exeAsset = release.assets?.find(
        (a: any) => a.name === `Solfege_${version}_x64-setup.exe`
      );
      if (sig && exeAsset) {
        manifest.platforms['windows-x86_64'] = {
          signature: sig,
          url: exeAsset.browser_download_url
        };
      }
    }

    if (macX64Sig) {
      const sig = await fetchSigContent(macX64Sig.browser_download_url);
      const tarAsset = release.assets?.find(
        (a: any) => a.name === 'Solfege_x64.app.tar.gz'
      );
      if (sig && tarAsset) {
        manifest.platforms['darwin-x86_64'] = {
          signature: sig,
          url: tarAsset.browser_download_url
        };
      }
    }

    if (macAarch64Sig) {
      const sig = await fetchSigContent(macAarch64Sig.browser_download_url);
      const tarAsset = release.assets?.find(
        (a: any) => a.name === 'Solfege_aarch64.app.tar.gz'
      );
      if (sig && tarAsset) {
        manifest.platforms['darwin-aarch64'] = {
          signature: sig,
          url: tarAsset.browser_download_url
        };
      }
    }

    if (Object.keys(manifest.platforms).length === 0) {
      console.warn(`Nessun file .sig trovato per ${tag}.`);
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(manifest);

  } catch (err: any) {
    console.error("Errore nell'endpoint latest-version:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
