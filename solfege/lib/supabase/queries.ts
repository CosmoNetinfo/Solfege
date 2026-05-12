import { Database } from '@/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

export async function getProfile(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, schools(*)')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function getSchoolData(supabase: SupabaseClient<Database>, schoolId: string) {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single();

  if (error) return null;
  return data;
}

export async function getKpiDashboard(supabase: SupabaseClient<Database>, schoolId: string) {
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
}

export async function getTodayLessons(supabase: SupabaseClient<Database>, schoolId: string) {
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
}

export async function getUpcomingPayments(supabase: SupabaseClient<Database>, schoolId: string) {
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
}

export async function getMonthlyIncomeData(supabase: SupabaseClient<Database>, schoolId: string) {
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
}

export async function getPayments(supabase: SupabaseClient<Database>, schoolId: string, filters?: { status?: string; studentId?: string; month?: number; year?: number }) {
  let query = supabase
    .from('payments')
    .select('*, students(first_name, last_name), enrollments(courses(name))')
    .eq('school_id', schoolId)
    .order('due_date', { ascending: false });

  if (filters?.status && filters.status !== 'tutti') {
    query = query.eq('status', filters.status);
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
        teachers (first_name, last_name, hourly_rate)
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
    teacherStats[tId].earnings += duration * Number(t.hourly_rate);
  });

  return Object.values(teacherStats);
}
