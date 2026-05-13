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
      return { success: false, error: 'Errore durante la verifica utente' }
    }

    const alreadyExists = usersData.users.find(u => u.email === teacher.email)
    
    if (alreadyExists) {
      console.log('[INVITE] Utente già esistente in auth:', alreadyExists.id)
      
      // Aggiorna il profile_id nella tabella teachers
      const { error: updateError } = await supabaseAdmin
        .from('teachers')
        .update({ profile_id: alreadyExists.id })
        .eq('id', teacher.id)

      if (updateError) {
        console.error('[INVITE] Errore aggiornamento teachers:', updateError)
        return { success: false, error: `Errore collegamento profilo teachers: ${updateError.message}` }
      }

      console.log('[INVITE] Aggiornamento profilo in corso...')
      // Assicuriamoci che il profilo esista e abbia il ruolo corretto
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: alreadyExists.id,
        school_id: teacher.school_id,
        role: 'insegnante',
        first_name: teacher.first_name,
        last_name: teacher.last_name
      })

      if (profileError) {
        console.error('[INVITE] Errore upsert profiles:', profileError)
        return { success: false, error: `Errore aggiornamento profilo: ${profileError.message}` }
      }

      return { success: true, message: 'Utente già registrato — profilo collegato' }
    }

    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/accept-invite`;
    console.log('[INVITE] Redirect URL:', redirectTo);

    // 2. Modalità Debug in Development
    if (process.env.NODE_ENV === 'development') {
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
        return { success: false, error: linkError.message }
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
      return { success: false, error: error.message }
    }

    console.log('[INVITE] Invito inviato con successo:', data.user?.id)
    revalidatePath("/admin/teachers");
    return { success: true, message: 'Email di invito inviata' }

  } catch (err) {
    console.error('[INVITE] Errore generico:', err)
    return { success: false, error: 'Errore interno del server' }
  }
}
