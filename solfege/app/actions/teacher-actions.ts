"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function inviteTeacher(teacher: { id: string; email: string; school_id: string; first_name: string; last_name: string }) {
  console.log('[INVITE] Inizio invito per:', teacher.email)
  
  try {
    const supabaseAdmin = createAdminClient();

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

      // Genera link di accesso (non invito) e mandalo via Resend
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: teacher.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/teacher/home`
        }
      })

      if (linkError) {
        console.error('[INVITE] Errore magiclink:', linkError)
        return { success: false, error: `Errore generateLink: ${linkError.message}` }
      }

      if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_12345678')) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Solfège <onboarding@resend.dev>',
            to: [teacher.email],
            subject: 'Accedi al portale Solfège',
            html: `
              <h2>Ciao ${teacher.first_name}!</h2>
              <p>Clicca il link per accedere al tuo portale docente:</p>
              <a href="${linkData?.properties?.action_link}" 
                 style="background:#E8621A;color:white;padding:12px 24px;
                        border-radius:6px;text-decoration:none;display:inline-block;margin-top:10px;">
                Accedi al portale
              </a>
              <p>Il link scade tra 24 ore.</p>
            `
          })
        })

        if (!res.ok) {
          const resData = await res.text()
          console.error('[INVITE] Errore API Resend:', res.status, resData)
          return { success: false, error: `Errore Resend ${res.status}: ${resData}` }
        }
      } else {
        console.log('[INVITE DEV] Link di accesso generato (Resend saltato):', linkData.properties?.action_link)
        return { success: true, message: 'Link di accesso generato in console (API Key Resend mancante)', action_link: linkData.properties?.action_link }
      }

      revalidatePath("/admin/teachers");
      return { success: true, message: 'Link di accesso inviato a ' + teacher.email }
    }

    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/accept-invite`;
    console.log('[INVITE] Redirect URL:', redirectTo);

    // 2. Modalità Debug in Development
    if (process.env.NODE_ENV === 'development' && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_12345678'))) {
      console.log('[INVITE DEV] Generazione link invece di invio email...')
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
        console.error('[INVITE DEV] Errore link:', linkError)
        return { success: false, error: `Errore generateLink DEV: ${linkError.message}` }
      }

      console.log('[INVITE DEV] Link generato:', linkData.properties?.action_link)
      return { 
        success: true, 
        message: 'Link di invito generato (vedi console server)',
        action_link: linkData.properties?.action_link 
      }
    }

    // 3. Invio email reale in Produzione
    console.log('[INVITE] Invio invito via email a:', teacher.email)
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(teacher.email, {
      redirectTo: redirectTo,
      data: {
        teacher_id: teacher.id,
        school_id: teacher.school_id,
        role: 'insegnante',
        first_name: teacher.first_name,
        last_name: teacher.last_name
      }
    })

    if (error) {
      console.error('[INVITE] Errore Supabase inviteUserByEmail:', error)
      if (error.message.includes('rate limit')) {
        return { success: false, error: 'Limite di invio raggiunto. Attendi qualche minuto.' }
      }
      return { success: false, error: `Errore Supabase Auth: ${error.message} (Status: ${error.status})` }
    }

    console.log('[INVITE] Invito inviato con successo:', data.user?.id)
    revalidatePath("/admin/teachers");
    return { success: true, message: `Invito inviato a ${teacher.email}` }

  } catch (err) {
    console.error('[INVITE] Errore generico:', err)
    return { success: false, error: `Errore Interno Server: ${err instanceof Error ? err.message : String(err)}` }
  }
}
