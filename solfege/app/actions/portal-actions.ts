"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import nodemailer from 'nodemailer';

export async function inviteStudent(student: { id: string; email: string; school_id: string; first_name: string; last_name: string; isParent?: boolean }) {
  console.log(`[INVITE ${student.isParent ? 'PARENT' : 'STUDENT'}] Inizio invito per:`, student.email)
  
  try {
    const supabaseAdmin = createAdminClient();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const host = (await headers()).get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;
    const redirectTo = `${origin}/accept-invite`;

    const role = student.isParent ? 'genitore' : 'studente';

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: student.email,
      options: {
        redirectTo: redirectTo,
        data: {
          student_id: student.id,
          school_id: student.school_id,
          role: role,
          first_name: student.first_name,
          last_name: student.last_name
        }
      }
    })

    if (linkError) {
      console.error(`[INVITE ${role}] Errore generateLink:`, linkError)
      return { success: false, error: `Errore generateLink: ${linkError.message}` }
    }

    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const subject = student.isParent 
        ? `Portale Genitori Solfège - ${student.first_name}` 
        : `Il tuo portale allievo Solfège`;
      
      const welcomeMsg = student.isParent
        ? `Abbiamo attivato il portale genitori per seguire il percorso di <strong>${student.first_name}</strong>.`
        : `La tua scuola ha attivato il portale Solfège per te.`;

      await transporter.sendMail({
        from: `"Solfège" <${process.env.GMAIL_USER}>`,
        to: student.email,
        subject: subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #E8621A; font-family: serif;">Solfège</h1>
            </div>
            <h2 style="color: #1c1917;">Ciao!</h2>
            <p style="font-size: 16px; line-height: 1.5;">${welcomeMsg}</p>
            <p style="font-size: 16px; line-height: 1.5;">Accedendo potrai consultare il calendario, verificare le presenze e gestire i pagamenti comodamente online.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${linkData?.properties?.action_link}" 
                   style="display:inline-block;background:#E8621A;color:white;
                          padding:14px 28px;border-radius:10px;text-decoration:none;
                          font-weight:bold;font-size: 16px;box-shadow: 0 4px 6px rgba(232, 98, 26, 0.2);">
                  Attiva il mio Portale
                </a>
            </div>
            <p style="color:#7A736C;font-size:14px;text-align: center;">Il link scade tra 24 ore.</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color:#9ca3af;font-size:12px;text-align: center;">
                Solfège — La gestione moderna per la tua scuola di musica.
            </p>
          </div>
        `
      })
    } else {
      console.log(`[INVITE ${role} DEV] Link generato:`, linkData.properties?.action_link)
      return { success: true, message: 'Link generato in console', action_link: linkData.properties?.action_link }
    }

    revalidatePath("/admin/students");
    return { success: true, message: `Invito inviato con successo a ${student.email}` }

  } catch (err) {
    console.error(`[INVITE STUDENT/PARENT] Errore:`, err)
    return { success: false, error: `Errore: ${err instanceof Error ? err.message : String(err)}` }
  }
}
