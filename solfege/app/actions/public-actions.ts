"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import nodemailer from 'nodemailer';

export async function registerPublicStudent(schoolId: string, data: any) {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Inserisci lo studente come inattivo (Lead)
    const { error } = await supabaseAdmin.from("students").insert({
      school_id: schoolId,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone: data.phone || null,
      dob: data.dob || null,
      notes: `ISCRIZIONE ONLINE: ${data.notes || ''}`,
      active: false // Inattivo finché non viene approvato
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
        subject: `Nuova Iscrizione Online - ${data.first_name} ${data.last_name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #E8621A; font-family: serif;">Nuova richiesta di iscrizione</h2>
            <p>Hai ricevuto una nuova iscrizione online per la tua scuola <strong>${school.name}</strong>.</p>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Nome:</strong> ${data.first_name} ${data.last_name}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email || 'Non fornita'}</p>
                <p style="margin: 5px 0;"><strong>Telefono:</strong> ${data.phone || 'Non fornito'}</p>
                <p style="margin: 5px 0;"><strong>Data di Nascita:</strong> ${data.dob || 'Non fornita'}</p>
            </div>

            <p><strong>Messaggio dell'allievo:</strong></p>
            <p style="font-style: italic; color: #666;">"${data.notes || 'Nessun messaggio'}"</p>
            
            <br/>
            <p style="font-size: 14px; color: #9ca3af;">L'allievo è stato creato automaticamente nel tuo database come "Inattivo". Accedi alla tua dashboard per attivarlo o contattarlo.</p>
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
