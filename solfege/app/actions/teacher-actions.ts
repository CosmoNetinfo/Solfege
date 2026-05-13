"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function inviteTeacher(teacher: { id: string; email: string; school_id: string; first_name: string; last_name: string }) {
  if (!teacher.email) {
    throw new Error("L'insegnante non ha un indirizzo email.");
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(
    teacher.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://solfege-five.vercel.app'}/api/auth/callback?next=/accept-invite`,
      data: {
        teacher_id: teacher.id,
        school_id: teacher.school_id,
        role: 'insegnante',
        first_name: teacher.first_name,
        last_name: teacher.last_name
      }
    }
  );

  if (error) {
    console.error("Errore invito insegnante:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/teachers");
  return { success: true, data };
}
