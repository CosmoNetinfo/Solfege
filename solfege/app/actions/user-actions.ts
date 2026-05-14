"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function deleteStaffUser(userId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Non autorizzato");
    }

    if (user.id === userId) {
      throw new Error("Non puoi eliminare il tuo stesso account");
    }

    const supabaseAdmin = createAdminClient();
    
    // Questo eliminerà l'utente da auth.users e, per l'impostazione in cascade, 
    // dal database principale (tabella profiles).
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Errore durante l'eliminazione dell'utente:", error);
    return { success: false, error: error.message || "Errore sconosciuto" };
  }
}

export async function updateUserRole(userId: string, newRole: "admin" | "segreteria" | "insegnante" | "studente" | "genitore") {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Non autorizzato");
    }

    if (user.id === userId) {
      throw new Error("Non puoi cambiare il tuo stesso ruolo");
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Errore durante l'aggiornamento del ruolo:", error);
    return { success: false, error: error.message || "Errore sconosciuto" };
  }
}
