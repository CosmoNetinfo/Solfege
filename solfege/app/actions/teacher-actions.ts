"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import nodemailer from 'nodemailer';

export async function inviteTeacher(teacher: { id: string; email: string; school_id: string; first_name: string; last_name: string }) {
  console.log('[INVITE] Inizio invito per:', teacher.email)
  
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

    // 1. Controlla se l'utente esiste già in auth.users
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) {
      console.error('[INVITE] Errore listUsers:', listError)
      return { success: false, error: `Errore listUsers: ${listError.message}` }
    }

    const alreadyExists = usersData.users.find(u => u.email === teacher.email)
    
    if (alreadyExists) {
      console.log('[INVITE] Utente già esistente in auth:', alreadyExists.id)
      
      // Caso 1: esiste già → collega profilo e genera magic link di accesso
      await supabaseAdmin.from('profiles').upsert({
        id: alreadyExists.id,
        role: 'insegnante',
        school_id: teacher.school_id,
        first_name: teacher.first_name,
        last_name: teacher.last_name
      })
      await supabaseAdmin.from('teachers')
        .update({ profile_id: alreadyExists.id })
        .eq('id', teacher.id)

      const host = (await headers()).get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      const origin = `${protocol}://${host}`;

      // Genera link di accesso (non invito) e mandalo via Gmail
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: teacher.email,
        options: {
          redirectTo: `${origin}/teacher/home`
        }
      })

      if (linkError) {
        console.error('[INVITE] Errore magiclink:', linkError)
        return { success: false, error: `Errore generateLink: ${linkError.message}` }
      }

      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        await transporter.sendMail({
          from: `"Solfège" <${process.env.GMAIL_USER}>`,
          to: teacher.email,
          subject: 'Accedi al portale Solfège',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #E8621A;">Ciao ${teacher.first_name}!</h2>
              <p>Clicca il link per accedere al tuo portale docente:</p>
              <a href="${linkData?.properties?.action_link}" 
                 style="display:inline-block;background:#E8621A;color:white;
                        padding:12px 24px;border-radius:6px;text-decoration:none;
                        font-weight:bold;margin-top:10px;">
                Accedi al portale
              </a>
              <p style="color:#7A736C;font-size:14px;margin-top:20px;">Il link scade tra 24 ore.</p>
            </div>
          `
        })
      } else {
        console.log('[INVITE DEV] Link di accesso generato (Gmail saltato):', linkData.properties?.action_link)
        return { success: true, message: 'Link generato in console (Credenziali Gmail mancanti)', action_link: linkData.properties?.action_link }
      }

      revalidatePath("/admin/teachers");
      return { success: true, message: 'Link di accesso inviato a ' + teacher.email }
    }

    const host = (await headers()).get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;
    // Mandiamo direttamente a /accept-invite
    const redirectTo = `${origin}/accept-invite`;
    console.log('[INVITE] Redirect URL diretto:', redirectTo);

    // 2. Generazione Link e Invio Email via Resend (Bypassa SMTP interno di Supabase)
    console.log('[INVITE] Generazione link di invito per nuovo utente...')
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: teacher.email,
      options: {
        redirectTo: redirectTo,
        data: {
          teacher_id: teacher.id,
          school_id: teacher.school_id,
          role: 'insegnante',
          first_name: teacher.first_name,
          last_name: teacher.last_name
        }
      }
    })

    if (linkError) {
      console.error('[INVITE] Errore generateLink:', linkError)
      return { success: false, error: `Errore generateLink: ${linkError.message}` }
    }

    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      console.log('[INVITE] Invio email tramite Nodemailer a:', teacher.email)
      await transporter.sendMail({
        from: `"Solfège" <${process.env.GMAIL_USER}>`,
        to: teacher.email,
        subject: 'Invito a unirti a Solfège',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E8621A;">Benvenuto su Solfège, ${teacher.first_name}!</h2>
            <p>Sei stato invitato come docente sulla piattaforma Solfège.</p>
            <p>Clicca il link qui sotto per accettare l'invito e impostare la tua password di accesso:</p>
            <a href="${linkData?.properties?.action_link}" 
               style="display:inline-block;background:#E8621A;color:white;
                      padding:12px 24px;border-radius:6px;text-decoration:none;
                      font-weight:bold;margin-top:10px;">
              Accetta Invito e Crea Password
            </a>
            <p style="color:#7A736C;font-size:14px;margin-top:20px;">Il link scade tra 24 ore.</p>
          </div>
        `
      })
    } else {
      console.log('[INVITE DEV] Link di invito generato (Gmail saltato):', linkData.properties?.action_link)
      return { success: true, message: 'Link generato in console (Credenziali Gmail mancanti)', action_link: linkData.properties?.action_link }
    }

    console.log('[INVITE] Invito completato per:', teacher.email)
    revalidatePath("/admin/teachers");
    return { success: true, message: `Invito inviato a ${teacher.email}` }

  } catch (err) {
    console.error('[INVITE] Errore generico:', err)
    return { success: false, error: `Errore Interno Server: ${err instanceof Error ? err.message : String(err)}` }
  }
}
