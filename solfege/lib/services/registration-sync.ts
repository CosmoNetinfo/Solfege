import Database from '@tauri-apps/plugin-sql';
import { invoke } from '@tauri-apps/api/core';
import { studentsDb } from '@/lib/desktop-db';

interface SyncResult {
  nuovi: number;
  aggiornati: number;
  invariati: number;
  errori: number;
}

export async function syncOnlineRegistrations(): Promise<SyncResult> {
  const result: SyncResult = { nuovi: 0, aggiornati: 0, invariati: 0, errori: 0 };
  
  try {
    const db = await Database.load('sqlite:solfege.db');
    
    // 1. Recupera school_id dal DB locale
    const schools = await db.select<{ id: string }[]>('SELECT id FROM schools LIMIT 1');
    if (schools.length === 0) {
      console.warn('[SYNC] Nessuna scuola configurata localmente. Skip sync.');
      return result;
    }
    const schoolId = schools[0].id;

    // 2. GET iscrizioni pendenti
    const res = await fetch(`https://solfege-five.vercel.app/api/online-registrations?school_id=${schoolId}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const pendingRegistrations = await res.json();
    
    if (!Array.isArray(pendingRegistrations) || pendingRegistrations.length === 0) {
      console.log('[SYNC] Nessuna nuova registrazione online da sincronizzare.');
      return result;
    }

    console.log(`[SYNC] Trovate ${pendingRegistrations.length} iscrizioni pendenti.`);

    // 4. Per ogni registrazione, esegui deduplicazione e import
    for (const reg of pendingRegistrations) {
      try {
        let existingStudent = null;
        let action = 'skipped';
        let finalStudentId = null;

        // a. Cerca duplicato (Deduplicazione)
        // 1: Codice Fiscale
        if (reg.codice_fiscale) {
          const byCf = await db.select<any[]>(
            'SELECT * FROM students WHERE UPPER(codice_fiscale) = ?', 
            [reg.codice_fiscale.toUpperCase()]
          );
          if (byCf.length > 0) existingStudent = byCf[0];
        }
        
        // 2: Nome + Cognome + Data di nascita
        if (!existingStudent && reg.data_nascita) {
          const byNameDob = await db.select<any[]>(
            'SELECT * FROM students WHERE LOWER(nome) = ? AND LOWER(cognome) = ? AND data_nascita = ?',
            [reg.nome.toLowerCase(), reg.cognome.toLowerCase(), reg.data_nascita]
          );
          if (byNameDob.length > 0) existingStudent = byNameDob[0];
        }

        // 3: Email
        if (!existingStudent && reg.email) {
            const byEmail = await db.select<any[]>(
              'SELECT * FROM students WHERE LOWER(email) = ?',
              [reg.email.toLowerCase()]
            );
            if (byEmail.length > 0) existingStudent = byEmail[0];
        }

        const noteText = `ISCRITTO ONLINE\nCorso d'interesse: ${reg.corso_interesse || '-'}\nLivello: ${reg.livello_esperienza || '-'}\nPreferenza Giorni: ${reg.preferenza_giorni || '-'}\nPreferenza Orario: ${reg.preferenza_orario || '-'}\nNote: ${reg.note || '-'}`;

        if (!existingStudent) {
          // b. NUOVO → INSERT
          const studentId = await studentsDb.create({
            nome: reg.nome,
            cognome: reg.cognome,
            data_nascita: reg.data_nascita || undefined,
            codice_fiscale: reg.codice_fiscale || undefined,
            email: reg.email || undefined,
            telefono: reg.telefono || undefined,
            indirizzo: reg.indirizzo || undefined,
            citta: reg.citta || undefined,
            cap: reg.cap || undefined,
            is_minorenne: reg.is_minorenne ? 1 : 0,
            genitore_nome: reg.genitore_nome || undefined,
            genitore_cognome: reg.genitore_cognome || undefined,
            genitore_email: reg.genitore_email || undefined,
            genitore_telefono: reg.genitore_telefono || undefined,
            genitore_codice_fiscale: reg.genitore_codice_fiscale || undefined,
            note: noteText,
          } as any);

          await db.execute('UPDATE students SET source = ?, online_registration_id = ? WHERE id = ?', ['online', reg.id, studentId]);

          finalStudentId = studentId;
          action = 'created';
          result.nuovi++;
        } else {
          // c. ESISTE → UPDATE (Merge)
          // Priorità al dato online se presente, altrimenti teniamo il locale
          const updateData: any = {};
          let isUpdated = false;

          const checkAndUpdate = (key: string, val: any) => {
            if (val !== null && val !== undefined && val !== '' && val !== existingStudent[key]) {
              updateData[key] = val;
              isUpdated = true;
            }
          };

          checkAndUpdate('data_nascita', reg.data_nascita);
          checkAndUpdate('codice_fiscale', reg.codice_fiscale);
          checkAndUpdate('email', reg.email);
          checkAndUpdate('telefono', reg.telefono);
          checkAndUpdate('indirizzo', reg.indirizzo);
          checkAndUpdate('citta', reg.citta);
          checkAndUpdate('cap', reg.cap);
          checkAndUpdate('is_minorenne', reg.is_minorenne ? 1 : 0);
          checkAndUpdate('genitore_nome', reg.genitore_nome);
          checkAndUpdate('genitore_cognome', reg.genitore_cognome);
          checkAndUpdate('genitore_email', reg.genitore_email);
          checkAndUpdate('genitore_telefono', reg.genitore_telefono);
          checkAndUpdate('genitore_codice_fiscale', reg.genitore_codice_fiscale);

          // Merge note
          if (noteText) {
             const existingNote = existingStudent.note || '';
             updateData.note = existingNote ? `${existingNote}\n\n--- Aggiornamento da iscrizione online ---\n${noteText}` : noteText;
             isUpdated = true;
          }

          if (isUpdated) {
            await studentsDb.update(existingStudent.id, updateData);
            await db.execute('UPDATE students SET online_registration_id = ? WHERE id = ?', [reg.id, existingStudent.id]);
            action = 'updated';
            result.aggiornati++;
          } else {
            action = 'skipped';
            result.invariati++;
          }
          finalStudentId = existingStudent.id;
        }

        // INSERT sync log
        const syncLogId = crypto.randomUUID();
        await db.execute(
          `INSERT INTO sync_log (id, registration_id, student_id, action, raw_data) VALUES (?, ?, ?, ?, ?)`,
          [syncLogId, reg.id, finalStudentId, action, JSON.stringify(reg)]
        );

        // e. PATCH su Supabase: status -> 'synced'
        const updateRes = await fetch(`https://solfege-five.vercel.app/api/online-registrations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registration_id: reg.id, status: 'synced' })
        });
        
        if (!updateRes.ok) {
           console.error(`[SYNC] Impossibile aggiornare stato online per reg ${reg.id}`);
        }

      } catch (err: any) {
        console.error(`[SYNC] Errore elaborazione registrazione ${reg.id}:`, err);
        result.errori++;
      }
    }

    // 5. Aggiorna last_registration_sync_at in app_config
    const now = new Date().toISOString();
    await invoke('set_config', { key: 'last_registration_sync_at', value: now });
    
    return result;
  } catch (error) {
    console.error('[SYNC] Errore critico durante sync:', error);
    throw error;
  }
}
