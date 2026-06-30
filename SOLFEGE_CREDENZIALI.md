# 🔐 Solfège — Credenziali & Accessi

> ⚠️ DOCUMENTO RISERVATO — Non condividere né committare su repository pubblici
> Ultimo aggiornamento: 2026-05-14

---

## 🌐 URL

| Ambiente | URL |
|----------|-----|
| **Produzione** | https://solfege-five.vercel.app |
| **Locale** | http://localhost:3000 |

---

## 👤 Credenziali di Test

### Admin (Accademia Verdi)
| Campo | Valore |
|-------|--------|
| Email | `admindany@gmail.com` |
| Password | `Password123!` |
| Ruolo | `admin` |
| Accesso | `/admin/dashboard` |

### Docente (Marco Bianchi)
| Campo | Valore |
|-------|--------|
| Email | `marco.bianchi@test.com` |
| Password | `Password123!` |
| Ruolo | `insegnante` |
| Accesso | `/teacher/home` |

---

## 🗄️ Supabase

| Chiave | Valore |
|--------|--------|
| **Project URL** | `https://tqpcoeahucwvtpkihgqi.supabase.co` |
| **Project ID** | `tqpcoeahucwvtpkihgqi` |
| **Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcGNvZWFodWN3dnRwa2loZ3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTQ5MjgsImV4cCI6MjA5NDE5MDkyOH0.yRPK9wmy0YUK_ivxILFsUf9uzA3JZUn5yo3DpnRxjL8` |
| **Service Role Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcGNvZWFodWN3dnRwa2loZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxNDkyOCwiZXhwIjoyMDk0MTkwOTI4fQ.llehwjzPHAkuS9X2njKYIt5LfkHCExClDgYMbRGnpEw` |
| **Dashboard** | https://supabase.com/dashboard/project/tqpcoeahucwvtpkihgqi |

### School IDs (Supabase DB)
| Scuola | ID |
|--------|-----|
| **Accademia Verdi** (principale) | `d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d` |
| **Accademia Test** | `8ac806c3-2a41-4f65-9db8-5ff525f5be59` |

### Storage Bucket
| Bucket | Uso |
|--------|-----|
| `logos` | Loghi delle scuole (Impostazioni → Scuola) |

---

## ☁️ Vercel

| Campo | Valore |
|-------|--------|
| **Dashboard** | https://vercel.com/dashboard |
| **Progetto** | `solfege-five` |
| **URL Produzione** | https://solfege-five.vercel.app |

### Environment Variables Vercel (da impostare in Dashboard → Settings → Environment Variables)
```
NEXT_PUBLIC_SUPABASE_URL=https://tqpcoeahucwvtpkihgqi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://solfege-five.vercel.app
RESEND_API_KEY=re_123456789  ← DA SOSTITUIRE con chiave reale
```

---

## 📧 Resend (Email)

| Campo | Valore |
|-------|--------|
| **Stato** | Placeholder — non configurato per produzione |
| **API Key attuale** | `re_123456789` (NON funzionante) |
| **Dashboard** | https://resend.com/api-keys |
| **Uso** | Invito docenti, solleciti pagamenti |

> Per abilitare le email reali: sostituire `re_123456789` con la chiave Resend reale sia in `.env.local` che nelle Environment Variables di Vercel.

---

## 🔗 Link Rapidi

| Risorsa | Link |
|---------|------|
| App in produzione | https://solfege-five.vercel.app/login |
| SQL Editor Supabase | https://supabase.com/dashboard/project/tqpcoeahucwvtpkihgqi/editor |
| Table Editor Supabase | https://supabase.com/dashboard/project/tqpcoeahucwvtpkihgqi/table-editor |
| Auth Users Supabase | https://supabase.com/dashboard/project/tqpcoeahucwvtpkihgqi/auth/users |
| Storage Supabase | https://supabase.com/dashboard/project/tqpcoeahucwvtpkihgqi/storage/buckets |
| Edge Functions Supabase | https://supabase.com/dashboard/project/tqpcoeahucwvtpkihgqi/functions |
| Logs Vercel | https://vercel.com/dashboard → solfege-five → Logs |
