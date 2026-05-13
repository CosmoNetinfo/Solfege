# SOLFÈGE — Debug Audit Completo Produzione
> Esegui questo audit in produzione su Vercel: https://solfege-five.vercel.app
> Per ogni problema trovato: documenta l'errore esatto → fixalo → verifica → aggiorna SOLFEGE_TASK_PROGRESS.md
> **Non passare alla sezione successiva finché tutti i task della sezione corrente non sono ✅**

---

## 1. AUTH & SESSIONE

- [x] Login con `admindany@gmail.com` → redirect a `/admin/dashboard` senza tornare al login
- [x] Sessione persiste dopo F5 (refresh pagina) — non deve tornare al login
- [x] Logout → redirect a `/login`
- [x] Accesso diretto a `/admin/dashboard` senza login → redirect a `/login`
- [x] Cookie di sessione Supabase impostati correttamente (verifica DevTools → Application → Cookies → cerca `sb-` cookies)

---

## 2. SIDEBAR & NAVIGAZIONE

- [x] Tutte le 9 voci di menu cliccabili e portano alla pagina giusta
- [x] Voce attiva evidenziata correttamente al cambio pagina
- [x] Nome scuola "Accademia Test" visibile in sidebar
- [x] Logo `solfege-logo.png` caricato correttamente (no broken image)
- [x] Logout dal UserMenu funziona

---

## 3. DASHBOARD

- [x] 4 KPI card caricano senza errori
- [x] Grafico incassi Recharts si renderizza (no errore width/height -1)
- [x] Sezione "Lezioni di oggi" visibile con dati
- [x] Sezione "Pagamenti in scadenza" visibile con badge colorati
- [x] Nessun errore rosso in console browser

---

## 4. MODULO ALLIEVI

- [x] Lista allievi carica i 10 allievi dal seed (Sbloccato da RLS)
- [x] Ricerca per nome funziona in real-time
- [x] Pulsante "+ Nuovo Allievo" apre il form
- [x] Creazione nuovo allievo → salva su DB → appare in lista
- [x] Campi genitore visibili SOLO se data nascita indica minorenne
- [x] Click su allievo → scheda con 5 tab (Anagrafica, Iscrizioni, Presenze, Pagamenti, Note)
- [x] Modifica allievo → salva correttamente (Inclusa Disponibilità Oraria)
- [x] Eliminazione allievo → dialog conferma → rimosso da lista
- [x] Implementata Disponibilità Oraria strutturata (griglia) in form e scheda

---

## 5. MODULO INSEGNANTI

- [x] Lista insegnanti carica le 3 card dal seed (Sbloccato da RLS)
- [x] "+ Nuovo Insegnante" apre form completo
- [x] Multi-select specializzazioni funziona (via stringa separata da virgola)
- [x] Griglia disponibilità → toggle giorno on/off funziona
- [x] Griglia disponibilità → ora inizio/fine si salvano
- [x] Salvataggio INSERT in `teachers` + `disponibilita_insegnanti`
- [x] Scheda insegnante → 5 tab funzionanti (Fix pulsante modifica collegato)
- [x] Implementato Flusso Invito Portale (Admin API + Callback + Accept Page)

---

## 6. MODULO CORSI

- [x] Card grid corsi visibile con colori `colore_calendario`
- [x] Filtri (tipo, livello, strumento) funzionano (implementata ricerca nome)
- [x] "+ Nuovo Corso" → form → salva correttamente
- [x] Dettaglio corso → lista iscritti visibile (via conteggio e card)
- [x] Modal iscrizione → autocomplete allievo funziona (via Select)
- [x] Modal iscrizione → insegnanti filtrati per disponibilità (LOGICA VERIFICATA)
- [x] Salvataggio iscrizione → INSERT in `enrollments`
- [x] Lezioni generate automaticamente (verifica in DB tabella `lessons`) -> FIX: durata_min
- [x] Pagamenti generati automaticamente (verifica in DB tabella `payments`) -> FIX: price
- [ ] Badge lista attesa se corso pieno

---

## 7. CALENDARIO

- [x] Calendario si carica con `react-big-calendar` (Fix ScrollArea e Build TS)
- [x] Lezioni visibili con colori corretti per corso
- [x] Toggle viste: Mese / Settimana / Giorno / Agenda
- [x] Filtri laterali funzionano (insegnante, corso, aula)
- [x] Click su lezione → drawer dettaglio si apre
- [x] Dropdown cambio stato lezione funziona e aggiorna DB (Fix Enum Casting)
- [x] Toggle presenze allievi (3 stati) funziona e aggiorna `attendance`
- [x] "Pianifica Recupero" → crea nuova lezione con `lezione_recupero_di`

---

## 8. INTERFACCIA DOCENTE (MOBILE)
- [x] Login docente → redirect /teacher/home (RBAC verificato)
- [x] Bottom Nav (4 voci) visibile e funzionante (Fix 404 routes)
- [x] Home mostra lezioni del giorno (Filtro RLS verificato)
- [x] Registrazione presenze da mobile → UPDATE attendance OK
- [x] Profilo docente → Mostra compensi dinamici (Fix maybeSingle() 406)
- [x] Lista allievi docente → Solo iscritti ai propri corsi OK

---

## 8. PAGAMENTI

- [ ] Lista pagamenti carica con `@tanstack/react-table`
- [ ] Tab: Tutti / In Attesa / In Ritardo / Pagati funzionano
- [ ] KPI card (Incassato mese, In attesa, In ritardo) mostrano valori corretti
- [ ] Badge colorati: amber (in attesa), verde (pagato), rosso (in ritardo)
- [ ] "Segna come Pagato" → dialog → aggiorna status + paid_date in DB
- [ ] Numero ricevuta progressivo generato correttamente
- [ ] Generazione PDF ricevuta funziona
- [ ] Download PDF funziona nel browser
- [ ] Web Share API funziona su mobile (testa su telefono)

---

## 9. IMPOSTAZIONI

- [ ] Tab Scuola → form carica dati esistenti
- [ ] Modifica nome scuola → salva → si aggiorna in sidebar in real-time
- [ ] Upload logo → carica su Supabase Storage bucket `logos` → URL salvato in `schools.logo_url`
- [ ] Tab Anno Accademico → modifica anno → salva
- [ ] Tab Strumenti → add strumento → appare in lista
- [ ] Tab Strumenti → remove strumento → rimosso da lista
- [ ] Tab Aule → add aula (nome + capienza + insonorizzata) → salva
- [ ] Tab Aule → remove aula → rimossa da lista
- [ ] Tab Utenti → lista profili visibile con ruoli
- [ ] Tab Abbonamento → piano e scadenza visibili

---

## 10. COMPENSI DOCENTI

- [ ] Tabella compensi carica con dati
- [ ] Selettore mese/anno funziona e ricarica dati
- [ ] Calcolo ore da `attendance` JOIN `lessons` JOIN `courses` corretto
- [ ] Badge "Da pagare" amber / "Pagato" verde corretti
- [ ] "Segna come Pagato" → aggiorna `teacher_compensations.paid = true` + `paid_date`

---

## 11. STATISTICHE

- [ ] Sezione Finanziaria: BarChart incassi mensili si renderizza
- [ ] Sezione Finanziaria: PieChart metodi pagamento si renderizza
- [ ] Sezione Finanziaria: KPI (Totale anno, Media mensile, Tasso morosità) visibili
- [ ] Sezione Allievi: LineChart iscrizioni per mese si renderizza
- [ ] Sezione Allievi: BarChart allievi per strumento si renderizza
- [ ] Sezione Lezioni: BarChart lezioni settimanali si renderizza
- [ ] Sezione Insegnanti: tabella compensi visibile
- [ ] Filtro anno scolastico aggiorna tutti i grafici
- [ ] Pulsante "Esporta CSV" scarica file valido
- [ ] Nessun errore Recharts in console

---

## 12. DEBUG PANEL

- [ ] Shortcut `Ctrl+Shift+D` apre il pannello
- [ ] Pulsante `Bug` fisso bottom-right visibile
- [ ] Tab Sessione: User ID, Email, Ruolo, School ID visibili con dati reali
- [ ] Tab Log: eventi in real-time con badge colorati
- [ ] Tab Log: filtro per tipo funziona
- [ ] Tab Log: "Pulisci log" e "Esporta JSON" funzionano
- [ ] Tab Database: stato connessione Supabase (verde/rosso)
- [ ] Tab Database: ultima query + ms visibili
- [ ] Tab Performance: memoria JS, route corrente, NODE_ENV visibili

---

## 13. INTERFACCIA DOCENTE MOBILE

- [x] `/teacher/home` carica correttamente (Aggiunte statistiche mensili dinamiche)
- [ ] Bottom nav con 4 voci funziona
- [x] Home mostra SOLO lezioni del docente loggato
- [x] Tap su "Segna presenze" → pagina presenze
- [x] Toggle presenze 3 stati (presente/assente/recupero) funziona su touch
- [x] "Salva presenze" → INSERT/UPDATE in `attendance` (Aggiorna anche lo stato lezione)
- [ ] Lista allievi mostra solo propri allievi (RLS verificato)
- [ ] Profilo docente mostra compenso mese corrente
- [ ] Layout corretto su 375px (iPhone SE)
- [ ] RLS: accesso a `/admin/*` da account docente → redirect a `/teacher/home`

---

## 14. LOGO & BRANDING

- [ ] Logo `solfege-logo.png` visibile in sidebar (no broken image, no testo "Solfège")
- [ ] Logo visibile in pagina login lato sinistro
- [ ] Logo visibile in pagina register lato sinistro
- [ ] Logo correttamente dimensionato (40px sidebar, 120px login, 80px register)
- [ ] Sfondo trasparente del logo funziona su sfondo scuro

---

## 15. PERFORMANCE & QUALITÀ

- [ ] `npx tsc --noEmit` → 0 errori TypeScript
- [ ] `npm run build` → 0 errori
- [ ] Nessun errore rosso in console browser in produzione
- [ ] Nessun warning critico nel build log Vercel
- [ ] Lighthouse score ≥ 80 su desktop (testa su https://pagespeed.web.dev)
- [ ] Skeleton loader visibili durante caricamento dati
- [ ] Toast sonner su tutte le operazioni CRUD
- [ ] Empty state su liste vuote
- [ ] 404 page funziona (vai su `/pagina-che-non-esiste`)

---

## 📋 REPORT FINALE

Al termine compila questa tabella:

| Sezione | Stato | Fix applicati |
|---------|-------|---------------|
| Auth & Sessione | | |
| Sidebar & Nav | | |
| Dashboard | | |
| Allievi | | |
| Insegnanti | | |
| Corsi | | |
| Calendario | | |
| Pagamenti | | |
| Impostazioni | | |
| Compensi | | |
| Statistiche | | |
| Debug Panel | | |
| Interfaccia Docente | | |
| Logo & Branding | | |
| Performance | | |

---

## 🐛 BUG TROVATI E RISOLTI

| Sezione | Errore | Fix applicato | Stato |
|---------|--------|---------------|-------|
| | | | |

---

*Solfège — Debug Audit Produzione*
*URL: https://solfege-five.vercel.app*
