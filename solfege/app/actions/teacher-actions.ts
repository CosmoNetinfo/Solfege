"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendCredenziali } from "./email-actions";

// Genera password temporanea
function generateTempPassword(): string {
  const base = 'Solfege'
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${base}${year}!${random}`
}

export async function createTeacherWithAccess(teacherData: any, schoolId: string, schoolName: string) {
  const supabaseAdmin = createAdminClient()
  const tempPassword = generateTempPassword()

  console.log(`[CREATE TEACHER] Creazione utente per ${teacherData.email} con password temporanea.`)

  // 1. Crea utente Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: teacherData.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: 'insegnante', school_id: schoolId }
  })

  if (authError) {
    console.error('[CREATE TEACHER] Errore Auth:', authError)
    return { success: false, error: authError.message }
  }

  // 2. Crea profilo
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: authUser.user.id,
    role: 'insegnante',
    school_id: schoolId,
    first_name: teacherData.first_name,
    last_name: teacherData.last_name,
  })

  if (profileError) {
    console.error('[CREATE TEACHER] Errore Profilo:', profileError)
    return { success: false, error: profileError.message }
  }

  // 3. INSERT insegnante
  const { data: teacher, error: teacherError } = await supabaseAdmin
    .from('teachers')
    .insert({
      first_name: teacherData.first_name,
      last_name: teacherData.last_name,
      email: teacherData.email,
      phone: teacherData.phone,
      bio: teacherData.bio,
      school_id: schoolId,
      profile_id: authUser.user.id
    })
    .select()
    .single()

  if (teacherError) {
    console.error('[CREATE TEACHER] Errore Teachers table:', teacherError)
    return { success: false, error: teacherError.message }
  }

  // 4. Manda email con credenziali
  let finalSchoolName = schoolName;
  if (!finalSchoolName) {
    const { data: school } = await supabaseAdmin.from('schools').select('name').eq('id', schoolId).single();
    finalSchoolName = school?.name || 'Solfège';
  }

  await sendCredenziali({
    to: teacherData.email,
    nome: teacherData.first_name,
    password: tempPassword,
    schoolName: finalSchoolName,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
  })

  revalidatePath("/admin/teachers")
  return { success: true, teacher }
}

export async function resetTeacherPassword(teacher: { email: string, first_name: string, profile_id: string }, schoolName: string) {
  if (!teacher.profile_id) return { success: false, error: "L'insegnante non ha un profilo collegato." }
  
  const supabaseAdmin = createAdminClient()
  const tempPassword = generateTempPassword()

  console.log(`[RESET PASSWORD] Reset per ${teacher.email}`)

  const { error } = await supabaseAdmin.auth.admin.updateUserById(teacher.profile_id, {
    password: tempPassword
  })

  if (error) {
    console.error('[RESET PASSWORD] Errore Auth:', error)
    return { success: false, error: error.message }
  }

  await sendCredenziali({
    to: teacher.email,
    nome: teacher.first_name,
    password: tempPassword,
    schoolName: schoolName,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
  })

  return { success: true, password: tempPassword }
}

export async function deleteTeacher(teacherId: string, profileId?: string) {
  const supabaseAdmin = createAdminClient()
  
  // 1. Elimina dalla tabella teachers
  const { error: teacherError } = await supabaseAdmin.from('teachers').delete().eq('id', teacherId)
  if (teacherError) return { success: false, error: teacherError.message }

  // 2. Se ha un profilo, eliminalo (questo eliminerà anche l'utente auth via trigger o manuale se preferito)
  if (profileId) {
    await supabaseAdmin.auth.admin.deleteUser(profileId)
    await supabaseAdmin.from('profiles').delete().eq('id', profileId)
  }

  revalidatePath("/admin/teachers")
  return { success: true }
}

