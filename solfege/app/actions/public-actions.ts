"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import nodemailer from 'nodemailer';

export async function registerPublicStudent(schoolId: string, data: any) {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Inserisci la registrazione nella tabella online_registrations in stato 'pending'
    const { error } = await supabaseAdmin.from("online_registrations" as any).insert({
      school_id: schoolId,
      nome: data.nome,
      cognome: data.cognome,
      data_nascita: data.data_nascita || null,
      codice_fiscale: data.codice_fiscale || null,
      email: data.email || null,
      telefono: data.telefono || null,
      is_minorenne: data.is_minorenne || false,
      genitore_nome: data.genitore_nome || null,
      genitore_cognome: data.genitore_cognome || null,
      genitore_email: data.genitore_email || null,
      genitore_telefono: data.genitore_telefono || null,
      genitore_codice_fiscale: data.genitore_codice_fiscale || null,
      corso_interesse: data.corso_interesse || null,
      note: data.note || null,
      status: 'pending'
    });

    if (error) throw error;

    // 2. Notifica la scuola
    const { data: school } = await supabaseAdmin.from("schools").select("email, name").eq("id", schoolId).single();
    
    if (school?.email && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      await transporter.sendMail({
        from: `"Solfège" <${process.env.GMAIL_USER}>`,
        to: school.email,
        subject: `Nuova Iscrizione Online - ${data.nome} ${data.cognome}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #E8621A; font-family: serif;">Nuova richiesta di iscrizione online</h2>
            <p>Hai ricevuto una nuova richiesta di iscrizione online per la tua scuola <strong>${school.name}</strong>.</p>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Nome:</strong> ${data.nome} ${data.cognome}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email || 'Non fornita'}</p>
                <p style="margin: 5px 0;"><strong>Telefono:</strong> ${data.telefono || 'Non fornito'}</p>
                <p style="margin: 5px 0;"><strong>Corso d'interesse:</strong> ${data.corso_interesse || 'Non specificato'}</p>
            </div>

            <p>Accedi all'app desktop e vai in <strong>Iscrizioni Web</strong> per approvare o rifiutare la richiesta.</p>
          </div>
        `
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('[PUBLIC REG] Errore:', error);
    return { success: false, error: error.message };
  }
}
