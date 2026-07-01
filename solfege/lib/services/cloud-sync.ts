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

    // 3. Estrai email admin locale
    const adminUsers = await db.select<any[]>("SELECT username FROM users WHERE role='admin' LIMIT 1");
    const adminEmail = adminUsers.length > 0 ? adminUsers[0].username : null;

    // 4. Estrai tutte le tabelle locali
    const students = await db.select<any[]>('SELECT * FROM students');
    const teachers = await db.select<any[]>('SELECT * FROM teachers');
    const courses = await db.select<any[]>('SELECT * FROM courses');
    const enrollments = await db.select<any[]>('SELECT * FROM enrollments');
    const lessons = await db.select<any[]>('SELECT * FROM lessons');
    const attendance = await db.select<any[]>('SELECT * FROM attendance');
    const payments = await db.select<any[]>('SELECT * FROM payments');
    const notices = await db.select<any[]>('SELECT * FROM school_notices');

    // 5. Invia payload all'endpoint di sincronizzazione
    const payload = {
      license_key: licenseKey,
      admin_email: adminEmail,
      school,
      students,
      teachers,
      courses,
      enrollments,
      lessons,
      attendance,
      payments,
      notices
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

    let result: any;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Risposta non valida dal server (${response.status}): ${text.substring(0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(result.error || `Errore ${response.status} durante la sincronizzazione cloud`);
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
