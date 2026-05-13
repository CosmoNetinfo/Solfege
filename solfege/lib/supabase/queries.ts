import { Database } from '@/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';
import { logger, useDebugStore } from '@/lib/debug/logger';

async function trackQuery<T>(name: string, queryFn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await queryFn();
    const duration = Math.round(performance.now() - start);
    useDebugStore.getState().setLastQuery(name, duration);
    logger.success(`Query ${name} completata`, { duration: `${duration}ms` });
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    logger.error(`Errore in query ${name}`, { error, duration: `${duration}ms` });
    throw error;
  }
}

import { createAdminClient } from '@/lib/supabase/admin';

export async function getProfile(supabase: SupabaseClient<Database>, userId: string) {
  return trackQuery('getProfile', async () => {
    // First try with the provided client (respecting RLS)
    const { data, error } = await supabase
      .from('profiles')
      .select('*, schools(*)')
      .eq('id', userId)
      .maybeSingle();

    // If RLS blocks it, fallback to the Admin Client to bypass RLS
    if (error && error.message.includes('permission denied')) {
      logger.error('RLS blocked profile read, falling back to Admin Client...');
      const adminClient = createAdminClient();
      const { data: adminData, error: adminError } = await adminClient
        .from('profiles')
        .select('*, schools(*)')
        .eq('id', userId)
          .maybeSingle();
      
      if (adminError) return null;
      return adminData;
    }

    if (error) return null;
    return data;
  });
}

export async function getSchoolData(supabase: SupabaseClient<Database>, schoolId: string) {
  return trackQuery('getSchoolData', async () => {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .maybeSingle();

    if (error) return null;
    return data;
  });
}

export async function getKpiDashboard(supabase: SupabaseClient<Database>, schoolId: string) {
  return trackQuery('getKpiDashboard', async () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // Eseguiamo le query in parallelo per performance
    const [
      { count: totalStudents },
      { count: totalTeachers },
      { data: payments },
      { count: lessonsToday }
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('active', true),
      supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('active', true),
      supabase.from('payments')
        .select('amount')
        .eq('school_id', schoolId)
        .eq('status', 'pagato')
        .gte('paid_date', firstDayOfMonth),
      supabase.from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .gte('data_ora_inizio', new Date().toISOString().split('T')[0] + 'T00:00:00')
        .lte('data_ora_inizio', new Date().toISOString().split('T')[0] + 'T23:59:59')
    ]);

    const monthlyIncome = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    return {
      totalStudents: totalStudents || 0,
      totalTeachers: totalTeachers || 0,
      monthlyIncome,
      lessonsToday: lessonsToday || 0,
    };
  });
}

export async function getTodayLessons(supabase: SupabaseClient<Database>, schoolId: string) {
  return trackQuery('getTodayLessons', async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('lessons')
      .select('id, data_ora_inizio, data_ora_fine, status, courses(name), teachers(first_name, last_name), rooms(name)')
      .eq('school_id', schoolId)
      .gte('data_ora_inizio', today + 'T00:00:00')
      .lte('data_ora_inizio', today + 'T23:59:59')
      .order('data_ora_inizio', { ascending: true })
      .limit(10);

    if (error) return [];
    return data || [];
  });
}

export async function getUpcomingPayments(supabase: SupabaseClient<Database>, schoolId: string) {
  return trackQuery('getUpcomingPayments', async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('payments')
      .select('id, amount, due_date, status, description, students(first_name, last_name)')
      .eq('school_id', schoolId)
      .in('status', ['in_attesa', 'in_ritardo'])
      .order('due_date', { ascending: true })
      .limit(8);

    if (error) return [];
    return data || [];
  });
}

export async function getMonthlyIncomeData(supabase: SupabaseClient<Database>, schoolId: string) {
  return trackQuery('getMonthlyIncomeData', async () => {
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from('payments')
      .select('amount, paid_date')
      .eq('school_id', schoolId)
      .eq('status', 'pagato')
      .gte('paid_date', `${year}-01-01`)
      .lte('paid_date', `${year}-12-31`);

    if (error) return [];

    const months = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
    const monthlyTotals = new Array(12).fill(0);

    (data || []).forEach((p) => {
      if (p.paid_date) {
        const monthIdx = new Date(p.paid_date).getMonth();
        monthlyTotals[monthIdx] += Number(p.amount) || 0;
      }
    });

    return months.map((name, i) => ({ name, totale: monthlyTotals[i] }));
  });
}

export async function getPayments(supabase: SupabaseClient<Database>, schoolId: string, filters?: { status?: string; studentId?: string; month?: number; year?: number }) {
  return trackQuery('getPayments', async () => {
    let query = supabase
      .from('payments')
      .select('*, students(first_name, last_name), enrollments(courses(name))')
      .eq('school_id', schoolId)
      .order('due_date', { ascending: false });

    if (filters?.status && filters.status !== 'tutti') {
      query = query.eq('status', filters.status as any);
    }

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters?.month !== undefined && filters?.year !== undefined) {
      const start = new Date(filters.year, filters.month, 1).toISOString();
      const end = new Date(filters.year, filters.month + 1, 0, 23, 59, 59).toISOString();
      query = query.gte('due_date', start).lte('due_date', end);
    }

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  });
}

export async function getFinancesSummary(supabase: SupabaseClient<Database>, schoolId: string) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const [
    { data: paidThisMonth },
    { data: pending },
    { data: overdue }
  ] = await Promise.all([
    supabase.from('payments').select('amount').eq('school_id', schoolId).eq('status', 'pagato').gte('paid_date', firstDayOfMonth),
    supabase.from('payments').select('amount').eq('school_id', schoolId).eq('status', 'in_attesa'),
    supabase.from('payments').select('amount').eq('school_id', schoolId).eq('status', 'in_ritardo')
  ]);

  return {
    collectedMonth: paidThisMonth?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    pendingTotal: pending?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    overdueTotal: overdue?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
  };
}

export async function getRevenueHistory(supabase: SupabaseClient<Database>, schoolId: string, year: number) {
  const { data, error } = await supabase
    .from('payments')
    .select('amount, paid_date')
    .eq('school_id', schoolId)
    .eq('status', 'pagato')
    .gte('paid_date', `${year}-01-01`)
    .lte('paid_date', `${year}-12-31`);

  if (error) return [];

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  const totals = new Array(12).fill(0);

  data?.forEach(p => {
    const month = new Date(p.paid_date!).getMonth();
    totals[month] += Number(p.amount);
  });

  return months.map((name, i) => ({ name, totale: totals[i] }));
}

export async function getStudentsDistribution(supabase: SupabaseClient<Database>, schoolId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('courses(name, colore_calendario)')
    .eq('school_id', schoolId)
    .eq('status', 'active');

  if (error) return [];

  const counts: Record<string, { name: string, value: number, color: string }> = {};
  data?.forEach(e => {
    const name = e.courses?.name || 'Altro';
    if (!counts[name]) {
      counts[name] = { name, value: 0, color: e.courses?.colore_calendario || '#E8621A' };
    }
    counts[name].value += 1;
  });

  return Object.values(counts);
}

export async function getTeacherReport(supabase: SupabaseClient<Database>, schoolId: string, month: number, year: number) {
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      status,
      lessons!inner (
        data_ora_inizio,
        data_ora_fine,
        teacher_id,
        teachers (first_name, last_name, rate_individual, rate_group)
      )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'present')
    .gte('lessons.data_ora_inizio', start)
    .lte('lessons.data_ora_inizio', end);

  if (error) return [];

  const teacherStats: Record<string, any> = {};
  data?.forEach(a => {
    const t = a.lessons.teachers;
    const tId = a.lessons.teacher_id;
    if (!tId || !t) return; // Skip if no teacher or teacher data
    
    if (!teacherStats[tId]) {
      teacherStats[tId] = {
        name: `${t.last_name} ${t.first_name}`,
        hours: 0,
        earnings: 0
      };
    }
    
    const start = new Date(a.lessons.data_ora_inizio);
    const end = new Date(a.lessons.data_ora_fine);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    teacherStats[tId].hours += duration;
    teacherStats[tId].earnings += duration * Number(t.rate_individual || 0);
  });

  return Object.values(teacherStats);
}

// --- IMPOSTAZIONI SCUOLA (STEP 13) ---

export async function updateSchool(supabase: SupabaseClient<Database>, schoolId: string, data: Partial<Database['public']['Tables']['schools']['Update']>) {
  return trackQuery('updateSchool', async () => {
    const { data: updatedData, error } = await supabase
      .from('schools')
      .update(data)
      .eq('id', schoolId)
      .select()
      .single();

    if (error) throw error;
    return updatedData;
  });
}

export async function getInstruments(supabase: SupabaseClient<Database>, schoolId: string) {
  return trackQuery('getInstruments', async () => {
    const { data, error } = await supabase
      .from('instruments')
      .select('*')
      .eq('school_id', schoolId)
      .order('name');
    if (error) throw error;
    return data || [];
  });
}

export async function addInstrument(supabase: SupabaseClient<Database>, schoolId: string, name: string) {
  return trackQuery('addInstrument', async () => {
    const { data, error } = await supabase
      .from('instruments')
      .insert({ school_id: schoolId, name })
      .select()
      .single();
    if (error) throw error;
    return data;
  });
}

export async function deleteInstrument(supabase: SupabaseClient<Database>, id: string) {
  return trackQuery('deleteInstrument', async () => {
    const { error } = await supabase.from('instruments').delete().eq('id', id);
    if (error) throw error;
    return true;
  });
}

export async function getRooms(supabase: SupabaseClient<Database>, schoolId: string) {
  return trackQuery('getRooms', async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('school_id', schoolId)
      .order('name');
    if (error) throw error;
    return data || [];
  });
}

export async function addRoom(supabase: SupabaseClient<Database>, schoolId: string, name: string, capacity: number, insonorizzata: boolean) {
  return trackQuery('addRoom', async () => {
    const { data, error } = await supabase
      .from('rooms')
      .insert({ school_id: schoolId, name, capacity, insonorizzata })
      .select()
      .single();
    if (error) throw error;
    return data;
  });
}

export async function deleteRoom(supabase: SupabaseClient<Database>, id: string) {
  return trackQuery('deleteRoom', async () => {
    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (error) throw error;
    return true;
  });
}

export async function getSchoolProfiles(supabase: SupabaseClient<Database>, schoolId: string) {
  return trackQuery('getSchoolProfiles', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  });
}

// ============================================================================
// COMPENSI DOCENTI
// ============================================================================

export async function getTeacherCompensations(supabase: SupabaseClient<Database>, schoolId: string, month: number, year: number) {
  return trackQuery('getTeacherCompensations', async () => {
    const { data: teachers, error: tError } = await supabase
      .from('teachers')
      .select('*')
      .eq('school_id', schoolId)
      .eq('active', true)
      .order('last_name');
      
    if (tError) throw tError;
    if (!teachers || teachers.length === 0) return [];

    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    const { data: lessons, error: lError } = await supabase
      .from('lessons')
      .select(`
        id, teacher_id, data_ora_inizio, data_ora_fine, status,
        courses!inner(type)
      `)
      .eq('school_id', schoolId)
      .eq('status', 'completata')
      .gte('data_ora_inizio', startDate)
      .lt('data_ora_inizio', endDate);

    if (lError) throw lError;

    const { data: compensations, error: cError } = await supabase
      .from('teacher_compensations')
      .select('*')
      .eq('school_id', schoolId)
      .eq('month', month)
      .eq('year', year);

    if (cError) throw cError;

    return teachers.map(teacher => {
      let hoursIndividual = 0;
      let hoursGroup = 0;

      const teacherLessons = lessons?.filter(l => l.teacher_id === teacher.id) || [];
      
      teacherLessons.forEach(l => {
        const start = new Date(l.data_ora_inizio);
        const end = new Date(l.data_ora_fine);
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        const course = Array.isArray(l.courses) ? l.courses[0] : l.courses;
        if (course?.type === 'individuale') {
          hoursIndividual += durationHours;
        } else {
          hoursGroup += durationHours;
        }
      });

      const totalAmount = (hoursIndividual * Number(teacher.rate_individual || 0)) + 
                          (hoursGroup * Number(teacher.rate_group || 0));

      const existingComp = compensations?.find(c => c.teacher_id === teacher.id);

      return {
        teacher,
        month,
        year,
        hours_individual: hoursIndividual,
        hours_group: hoursGroup,
        total_amount: totalAmount,
        paid: existingComp?.paid || false,
        paid_date: existingComp?.paid_date || null
      };
    });
  });
}

export async function markCompensationAsPaid(
  supabase: SupabaseClient<Database>, 
  schoolId: string, 
  teacherId: string, 
  month: number, 
  year: number,
  hoursIndividual: number,
  hoursGroup: number,
  totalAmount: number,
  paid: boolean
) {
  return trackQuery('markCompensationAsPaid', async () => {
    const { data, error } = await supabase
      .from('teacher_compensations')
      .upsert({
        school_id: schoolId,
        teacher_id: teacherId,
        month,
        year,
        hours_individual: hoursIndividual,
        hours_group: hoursGroup,
        total_amount: totalAmount,
        paid,
        paid_date: paid ? new Date().toISOString() : null,
      }, { onConflict: 'teacher_id, month, year' })
      .select()
      .maybeSingle();
      
    if (error) throw error;
    return data;
  });
}
