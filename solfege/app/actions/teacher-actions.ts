"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendCredenziali, sendNuoveCredenziali } from "./email-actions";

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
      phone: teacherData.phone || null,
      fiscal_code: teacherData.fiscal_code || null,
      specializzazioni: teacherData.specializzazioni || [],
      rate_individual: teacherData.rate_individual || 0,
      rate_group: teacherData.rate_group || 0,
      iban: teacherData.iban || null,
      note_contratto: teacherData.note_contratto || null,
      data_assunzione: teacherData.data_assunzione || null,
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

export async function inviteExistingTeacher(teacher: { id: string, email: string, first_name: string, last_name: string, school_id: string }, schoolName: string) {
  const supabaseAdmin = createAdminClient()
  const tempPassword = generateTempPassword()

  console.log(`[INVITE EXISTING] Creazione accesso per insegnante ${teacher.id}`)

  // 1. Crea utente Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: teacher.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: 'insegnante', school_id: teacher.school_id }
  })

  if (authError) return { success: false, error: authError.message }

  // 2. Crea profilo
  await supabaseAdmin.from('profiles').upsert({
    id: authUser.user.id,
    role: 'insegnante',
    school_id: teacher.school_id,
    first_name: teacher.first_name,
    last_name: teacher.last_name,
  })

  // 3. Collega profile_id all'insegnante
  await supabaseAdmin.from('teachers').update({ profile_id: authUser.user.id }).eq('id', teacher.id)

  // 4. Manda email
  let finalSchoolName = schoolName;
  if (!finalSchoolName) {
    const { data: school } = await supabaseAdmin.from('schools').select('name').eq('id', teacher.school_id).single();
    finalSchoolName = school?.name || 'Solfège';
  }

  await sendCredenziali({
    to: teacher.email,
    nome: teacher.first_name,
    password: tempPassword,
    schoolName: finalSchoolName,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
  })

  revalidatePath("/admin/teachers")
  return { success: true }
}

export async function resetTeacherPassword(email: string, nome: string, profile_id: string, schoolName: string, schoolId: string) {
  if (!profile_id) return { success: false, error: "L'insegnante non ha un profilo collegato." }
  
  const supabaseAdmin = createAdminClient()
  const tempPassword = generateTempPassword()

  console.log(`[RESET PASSWORD] Reset per ${email}`)

  const { error } = await supabaseAdmin.auth.admin.updateUserById(profile_id, {
    password: tempPassword
  })

  if (error) return { success: false, error: error.message }

  let finalSchoolName = schoolName;
  if (!finalSchoolName) {
    const { data: school } = await supabaseAdmin.from('schools').select('name').eq('id', schoolId).single();
    finalSchoolName = school?.name || 'Solfège';
  }

  await sendNuoveCredenziali({
    to: email,
    nome: nome,
    password: tempPassword,
    schoolName: finalSchoolName,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
  })

  return { success: true }
}

export async function deleteTeacher(teacherId: string, profileId?: string) {
  const supabaseAdmin = createAdminClient()
  
  const { error: teacherError } = await supabaseAdmin.from('teachers').delete().eq('id', teacherId)
  if (teacherError) return { success: false, error: teacherError.message }

  if (profileId) {
    await supabaseAdmin.auth.admin.deleteUser(profileId)
    await supabaseAdmin.from('profiles').delete().eq('id', profileId)
  }

  revalidatePath("/admin/teachers")
  return { success: true }
}


