import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Cron job che pinga Supabase ogni giorno per evitare la pausa
 * del progetto sul piano Free (inattività > 7 giorni).
 * 
 * Configurato in vercel.json con schedule: "0 6 * * *" (ogni giorno alle 06:00 UTC)
 */
export async function GET(request: Request) {
  // Verifica che la richiesta arrivi dal cron di Vercel
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Query leggera per tenere attivo il database
    const { count, error } = await supabase
      .from('schools')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('[keep-alive] Supabase error:', error.message);
      return NextResponse.json({ 
        status: 'error', 
        message: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log(`[keep-alive] Ping OK — ${count} scuole attive — ${new Date().toISOString()}`);

    return NextResponse.json({ 
      status: 'ok', 
      schools: count,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[keep-alive] Exception:', err.message);
    return NextResponse.json({ 
      status: 'error', 
      message: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
