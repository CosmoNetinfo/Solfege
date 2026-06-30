# ANTIGRAVITY — BRIEF: GitHub Actions CI/CD Tauri

## Obiettivo
Creare il workflow GitHub Actions che compila automaticamente l'app Tauri per Windows, Mac e Linux ogni volta che viene pushato un tag versione (es. `v1.0.0`).

**IMPORTANTE:** Tauri non è ancora integrato nel progetto. Questo workflow va creato ORA in modo che sia già pronto quando si integrerà Tauri. Per ora il workflow può essere creato ma non si attiverà finché non ci sarà la cartella `src-tauri/`.

---

## File da creare

### `.github/workflows/tauri-release.yml`

```yaml
name: Tauri Release

on:
  push:
    tags:
      - 'v*'

jobs:
  create-release:
    runs-on: ubuntu-latest
    outputs:
      release_id: ${{ steps.create-release.outputs.result }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Create GitHub Release (draft)
        id: create-release
        uses: actions/github-script@v7
        with:
          script: |
            const tag = context.ref.replace('refs/tags/', '')
            const { data } = await github.rest.repos.createRelease({
              owner: context.repo.owner,
              repo: context.repo.repo,
              tag_name: tag,
              name: `Solfège ${tag}`,
              body: 'Nuova versione di Solfège Desktop. Vedi le note di rilascio complete nel pannello Super Admin.',
              draft: true,
              prerelease: false
            })
            return data.id

  build-tauri:
    needs: create-release
    strategy:
      fail-fast: false
      matrix:
        include:
          - os: windows-latest
            target: x86_64-pc-windows-msvc
            artifact: Solfege_*.exe
          - os: macos-latest
            target: x86_64-apple-darwin
            artifact: Solfege_*.dmg
          - os: macos-latest
            target: aarch64-apple-darwin
            artifact: Solfege_*_aarch64.dmg
          - os: ubuntu-22.04
            target: x86_64-unknown-linux-gnu
            artifact: solfege_*.AppImage

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup Rust toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Cache Rust dependencies
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'

      - name: Install Linux system dependencies
        if: matrix.os == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libwebkit2gtk-4.1-dev \
            libappindicator3-dev \
            librsvg2-dev \
            patchelf \
            libssl-dev

      - name: Install frontend dependencies
        run: npm ci

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          releaseId: ${{ needs.create-release.outputs.release_id }}
          target: ${{ matrix.target }}
          args: --target ${{ matrix.target }}

  publish-release:
    needs: [create-release, build-tauri]
    runs-on: ubuntu-latest
    steps:
      - name: Publish Release (draft → public)
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.repos.updateRelease({
              owner: context.repo.owner,
              repo: context.repo.repo,
              release_id: ${{ needs.create-release.outputs.release_id }},
              draft: false
            })
```

---

## Secrets da aggiungere su GitHub

Andare su: `github.com/CosmoNetinfo/Solfege` → Settings → Secrets and variables → Actions → New repository secret

Aggiungere questi due secrets:

```
TAURI_SIGNING_PRIVATE_KEY
TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

I valori verranno generati con il comando Tauri nella fase di integrazione desktop. Per ora creare i secrets con valori placeholder (es. `placeholder`) — verranno aggiornati quando si integra Tauri.

---

## Come si usa (quando Tauri sarà integrato)

```bash
# 1. Aggiornare versione in src-tauri/tauri.conf.json
# 2. Commit e push normale
git add .
git commit -m "chore: bump version to 1.0.1"
git push

# 3. Creare e pushare il tag
git tag v1.0.1
git push origin v1.0.1

# → GitHub Actions parte automaticamente
# → Compila per Windows (.exe), Mac Intel (.dmg), Mac Apple Silicon (.dmg), Linux (.AppImage)
# → Pubblica la release su GitHub con tutti i file allegati
# → L'app desktop dei clienti riceve notifica aggiornamento automatico
```

---

## Checklist verifica

- [ ] File `.github/workflows/tauri-release.yml` creato nel repository
- [ ] Secrets `TAURI_SIGNING_PRIVATE_KEY` e `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` aggiunti su GitHub (anche con placeholder per ora)
- [ ] `git add . && git commit -m "ci: add Tauri release GitHub Actions workflow" && git push`
- [ ] Verificare su github.com/CosmoNetinfo/Solfege → Actions che il file workflow appare nella lista (non si attiverà finché non si pusha un tag)

---

*Solfège v2.0 — CosmoNet.info*
