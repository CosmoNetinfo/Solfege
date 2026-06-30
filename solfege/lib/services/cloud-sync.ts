import Database from '@tauri-apps/plugin-sql';
import { invoke } from '@tauri-apps/api/core';

export async function syncLocalToCloud(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Carica DB e config
    const db = await Database.load('sqlite:solfege.db');
    const licenseKey = await invoke<string | null>('get_config', { key: 'license_key' });

    if (!licenseKey) {
      return { success: false, message: 'Chiave licenza non trovata. Attiva la licenza prima di sincronizzare.' };
    }

    // 2. Recupera dati scuola
    const schools = await db.select<any[]>('SELECT * FROM schools LIMIT 1');
    if (schools.length === 0) {
      return { success: false, message: 'Dati scuola locali non configurati.' };
    }
    const school = schools[0];

    // 3. Estrai tutte le tabelle locali
    const students = await db.select<any[]>('SELECT * FROM students');
    const teachers = await db.select<any[]>('SELECT * FROM teachers');
    const courses = await db.select<any[]>('SELECT * FROM courses');
    const enrollments = await db.select<any[]>('SELECT * FROM enrollments');
    const lessons = await db.select<any[]>('SELECT * FROM lessons');
    const attendance = await db.select<any[]>('SELECT * FROM attendance');
    const payments = await db.select<any[]>('SELECT * FROM payments');

    // 4. Invia payload all'endpoint di sincronizzazione
    const payload = {
      license_key: licenseKey,
      school,
      students,
      teachers,
      courses,
      enrollments,
      lessons,
      attendance,
      payments
    };

    console.log('[CLOUD-SYNC] Avvio sincronizzazione...', {
      students: students.length,
      teachers: teachers.length,
      lessons: lessons.length
    });

    const response = await fetch('https://solfege-five.vercel.app/api/sync-school-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Errore durante la sincronizzazione cloud');
    }

    // Aggiorna data ultimo sync in config locale
    const now = new Date().toISOString();
    await invoke('set_config', { key: 'last_cloud_sync_at', value: now });

    console.log('[CLOUD-SYNC] Sincronizzazione completata con successo');
    return { success: true, message: 'Sincronizzazione completata con successo' };
  } catch (err: any) {
    console.error('[CLOUD-SYNC] Fallito:', err.message || err);
    return { success: false, message: err.message || 'Errore di connessione al server cloud.' };
  }
}
